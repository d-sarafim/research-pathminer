renderFrame(frameState, target) {
  const layerState = frameState.layerStatesArray[frameState.layerIndex];
  const viewState = frameState.viewState;
  const projection = viewState.projection;
  const viewResolution = viewState.resolution;
  const viewCenter = viewState.center;
  const rotation = viewState.rotation;
  const pixelRatio = frameState.pixelRatio;

  const tileLayer = this.getLayer();
  const tileSource = tileLayer.getSource();
  const sourceRevision = tileSource.getRevision();
  const tileGrid = tileSource.getTileGridForProjection(projection);
  const z = tileGrid.getZForResolution(viewResolution, tileSource.zDirection);
  const tileResolution = tileGrid.getResolution(z);

  let extent = frameState.extent;
  const resolution = frameState.viewState.resolution;
  const tilePixelRatio = tileSource.getTilePixelRatio(pixelRatio);
  // desired dimensions of the canvas in pixels
  const width = Math.round((getWidth(extent) / resolution) * pixelRatio);
  const height = Math.round((getHeight(extent) / resolution) * pixelRatio);

  const layerExtent =
    layerState.extent && fromUserExtent(layerState.extent, projection);
  if (layerExtent) {
    extent = getIntersection(
      extent,
      fromUserExtent(layerState.extent, projection)
    );
  }

  const dx = (tileResolution * width) / 2 / tilePixelRatio;
  const dy = (tileResolution * height) / 2 / tilePixelRatio;
  const canvasExtent = [
    viewCenter[0] - dx,
    viewCenter[1] - dy,
    viewCenter[0] + dx,
    viewCenter[1] + dy,
  ];

  const tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);

  /**
   * @type {Object<number, Object<string, import("../../Tile.js").default>>}
   */
  const tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  const findLoadedTiles = this.createLoadedTileFinder(
    tileSource,
    projection,
    tilesToDrawByZ
  );

  const tmpExtent = this.tmpExtent;
  const tmpTileRange = this.tmpTileRange_;
  this.newTiles_ = false;
  const viewport = rotation
    ? getRotatedViewport(
        viewState.center,
        resolution,
        rotation,
        frameState.size
      )
    : undefined;
  for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
      if (
        rotation &&
        !tileGrid.tileCoordIntersectsViewport([z, x, y], viewport)
      ) {
        continue;
      }
      const tile = this.getTile(z, x, y, frameState);
      if (this.isDrawableTile(tile)) {
        const uid = getUid(this);
        if (tile.getState() == TileState.LOADED) {
          tilesToDrawByZ[z][tile.tileCoord.toString()] = tile;
          let inTransition = tile.inTransition(uid);
          if (inTransition && layerState.opacity !== 1) {
            // Skipping transition when layer is not fully opaque avoids visual artifacts.
            tile.endTransition(uid);
            inTransition = false;
          }
          if (
            !this.newTiles_ &&
            (inTransition || !this.renderedTiles.includes(tile))
          ) {
            this.newTiles_ = true;
          }
        }
        if (tile.getAlpha(uid, frameState.time) === 1) {
          // don't look for alt tiles if alpha is 1
          continue;
        }
      }

      const childTileRange = tileGrid.getTileCoordChildTileRange(
        tile.tileCoord,
        tmpTileRange,
        tmpExtent
      );

      let covered = false;
      if (childTileRange) {
        covered = findLoadedTiles(z + 1, childTileRange);
      }
      if (!covered) {
        tileGrid.forEachTileCoordParentTileRange(
          tile.tileCoord,
          findLoadedTiles,
          tmpTileRange,
          tmpExtent
        );
      }
    }
  }

  const canvasScale =
    ((tileResolution / viewResolution) * pixelRatio) / tilePixelRatio;

  // set forward and inverse pixel transforms
  composeTransform(
    this.pixelTransform,
    frameState.size[0] / 2,
    frameState.size[1] / 2,
    1 / pixelRatio,
    1 / pixelRatio,
    rotation,
    -width / 2,
    -height / 2
  );

  const canvasTransform = toTransformString(this.pixelTransform);

  this.useContainer(target, canvasTransform, this.getBackground(frameState));
  const context = this.context;
  const canvas = context.canvas;

  makeInverse(this.inversePixelTransform, this.pixelTransform);

  // set scale transform for calculating tile positions on the canvas
  composeTransform(
    this.tempTransform,
    width / 2,
    height / 2,
    canvasScale,
    canvasScale,
    0,
    -width / 2,
    -height / 2
  );

  if (canvas.width != width || canvas.height != height) {
    canvas.width = width;
    canvas.height = height;
  } else if (!this.containerReused) {
    context.clearRect(0, 0, width, height);
  }

  if (layerExtent) {
    this.clipUnrotated(context, frameState, layerExtent);
  }

  if (!tileSource.getInterpolate()) {
    context.imageSmoothingEnabled = false;
  }

  this.preRender(context, frameState);

  this.renderedTiles.length = 0;
  /** @type {Array<number>} */
  let zs = Object.keys(tilesToDrawByZ).map(Number);
  zs.sort(ascending);

  let clips, clipZs, currentClip;
  if (
    layerState.opacity === 1 &&
    (!this.containerReused ||
      tileSource.getOpaque(frameState.viewState.projection))
  ) {
    zs = zs.reverse();
  } else {
    clips = [];
    clipZs = [];
  }
  for (let i = zs.length - 1; i >= 0; --i) {
    const currentZ = zs[i];
    const currentTilePixelSize = tileSource.getTilePixelSize(
      currentZ,
      pixelRatio,
      projection
    );
    const currentResolution = tileGrid.getResolution(currentZ);
    const currentScale = currentResolution / tileResolution;
    const dx = currentTilePixelSize[0] * currentScale * canvasScale;
    const dy = currentTilePixelSize[1] * currentScale * canvasScale;
    const originTileCoord = tileGrid.getTileCoordForCoordAndZ(
      getTopLeft(canvasExtent),
      currentZ
    );
    const originTileExtent = tileGrid.getTileCoordExtent(originTileCoord);
    const origin = applyTransform(this.tempTransform, [
      (tilePixelRatio * (originTileExtent[0] - canvasExtent[0])) /
        tileResolution,
      (tilePixelRatio * (canvasExtent[3] - originTileExtent[3])) /
        tileResolution,
    ]);
    const tileGutter =
      tilePixelRatio * tileSource.getGutterForProjection(projection);
    const tilesToDraw = tilesToDrawByZ[currentZ];
    for (const tileCoordKey in tilesToDraw) {
      const tile = /** @type {import("../../ImageTile.js").default} */ (
        tilesToDraw[tileCoordKey]
      );
      const tileCoord = tile.tileCoord;

      // Calculate integer positions and sizes so that tiles align
      const xIndex = originTileCoord[1] - tileCoord[1];
      const nextX = Math.round(origin[0] - (xIndex - 1) * dx);
      const yIndex = originTileCoord[2] - tileCoord[2];
      const nextY = Math.round(origin[1] - (yIndex - 1) * dy);
      const x = Math.round(origin[0] - xIndex * dx);
      const y = Math.round(origin[1] - yIndex * dy);
      const w = nextX - x;
      const h = nextY - y;
      const transition = z === currentZ;

      const inTransition =
        transition && tile.getAlpha(getUid(this), frameState.time) !== 1;
      let contextSaved = false;
      if (!inTransition) {
        if (clips) {
          // Clip mask for regions in this tile that already filled by a higher z tile
          currentClip = [x, y, x + w, y, x + w, y + h, x, y + h];
          for (let i = 0, ii = clips.length; i < ii; ++i) {
            if (z !== currentZ && currentZ < clipZs[i]) {
              const clip = clips[i];
              if (
                intersects(
                  [x, y, x + w, y + h],
                  [clip[0], clip[3], clip[4], clip[7]]
                )
              ) {
                if (!contextSaved) {
                  context.save();
                  contextSaved = true;
                }
                context.beginPath();
                // counter-clockwise (outer ring) for current tile
                context.moveTo(currentClip[0], currentClip[1]);
                context.lineTo(currentClip[2], currentClip[3]);
                context.lineTo(currentClip[4], currentClip[5]);
                context.lineTo(currentClip[6], currentClip[7]);
                // clockwise (inner ring) for higher z tile
                context.moveTo(clip[6], clip[7]);
                context.lineTo(clip[4], clip[5]);
                context.lineTo(clip[2], clip[3]);
                context.lineTo(clip[0], clip[1]);
                context.clip();
              }
            }
          }
          clips.push(currentClip);
          clipZs.push(currentZ);
        } else {
          context.clearRect(x, y, w, h);
        }
      }
      this.drawTileImage(
        tile,
        frameState,
        x,
        y,
        w,
        h,
        tileGutter,
        transition
      );
      if (clips && !inTransition) {
        if (contextSaved) {
          context.restore();
        }
        this.renderedTiles.unshift(tile);
      } else {
        this.renderedTiles.push(tile);
      }
      this.updateUsedTiles(frameState.usedTiles, tileSource, tile);
    }
  }

  this.renderedRevision = sourceRevision;
  this.renderedResolution = tileResolution;
  this.extentChanged =
    !this.renderedExtent_ || !equals(this.renderedExtent_, canvasExtent);
  this.renderedExtent_ = canvasExtent;
  this.renderedPixelRatio = pixelRatio;
  this.renderedProjection = projection;

  this.manageTilePyramid(
    frameState,
    tileSource,
    tileGrid,
    pixelRatio,
    projection,
    extent,
    z,
    tileLayer.getPreload()
  );
  this.scheduleExpireCache(frameState, tileSource);

  this.postRender(context, frameState);

  if (layerState.extent) {
    context.restore();
  }
  context.imageSmoothingEnabled = true;

  if (canvasTransform !== canvas.style.transform) {
    canvas.style.transform = canvasTransform;
  }

  return this.container;
}
