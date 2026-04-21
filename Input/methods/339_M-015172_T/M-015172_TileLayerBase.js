renderFrame(frameState) {
  this.frameState = frameState;
  this.renderComplete = true;
  const gl = this.helper.getGL();
  this.preRender(gl, frameState);

  const viewState = frameState.viewState;
  const tileLayer = this.getLayer();
  const tileSource = tileLayer.getRenderSource();
  const tileGrid = tileSource.getTileGridForProjection(viewState.projection);
  const gutter = tileSource.getGutterForProjection(viewState.projection);
  const extent = getRenderExtent(frameState, frameState.extent);
  const z = tileGrid.getZForResolution(
    viewState.resolution,
    tileSource.zDirection
  );

  /**
   * @type {TileRepresentationLookup}
   */
  const tileRepresentationLookup = newTileRepresentationLookup();

  const preload = tileLayer.getPreload();
  if (frameState.nextExtent) {
    const targetZ = tileGrid.getZForResolution(
      viewState.nextResolution,
      tileSource.zDirection
    );
    const nextExtent = getRenderExtent(frameState, frameState.nextExtent);
    this.enqueueTiles(
      frameState,
      nextExtent,
      targetZ,
      tileRepresentationLookup,
      preload
    );
  }

  this.enqueueTiles(frameState, extent, z, tileRepresentationLookup, 0);
  if (preload > 0) {
    setTimeout(() => {
      this.enqueueTiles(
        frameState,
        extent,
        z - 1,
        tileRepresentationLookup,
        preload - 1
      );
    }, 0);
  }

  /**
   * A lookup of alpha values for tiles at the target rendering resolution
   * for tiles that are in transition.  If a tile coord key is absent from
   * this lookup, the tile should be rendered at alpha 1.
   * @type {Object<string, number>}
   */
  const alphaLookup = {};

  const uid = getUid(this);
  const time = frameState.time;
  let blend = false;

  // look for cached tiles to use if a target tile is not ready
  for (const tileRepresentation of tileRepresentationLookup
    .representationsByZ[z]) {
    const tile = tileRepresentation.tile;
    if (
      (tile instanceof ReprojTile || tile instanceof ReprojDataTile) &&
      tile.getState() === TileState.EMPTY
    ) {
      continue;
    }
    const tileCoord = tile.tileCoord;

    if (tileRepresentation.loaded) {
      const alpha = tile.getAlpha(uid, time);
      if (alpha === 1) {
        // no need to look for alt tiles
        tile.endTransition(uid);
        continue;
      }
      blend = true;
      const tileCoordKey = getTileCoordKey(tileCoord);
      alphaLookup[tileCoordKey] = alpha;
    }
    this.renderComplete = false;

    // first look for child tiles (at z + 1)
    const coveredByChildren = this.findAltTiles_(
      tileGrid,
      tileCoord,
      z + 1,
      tileRepresentationLookup
    );

    if (coveredByChildren) {
      continue;
    }

    // next look for parent tiles
    const minZoom = tileGrid.getMinZoom();
    for (let parentZ = z - 1; parentZ >= minZoom; --parentZ) {
      const coveredByParent = this.findAltTiles_(
        tileGrid,
        tileCoord,
        parentZ,
        tileRepresentationLookup
      );

      if (coveredByParent) {
        break;
      }
    }
  }

  this.beforeTilesRender(frameState, blend);

  const representationsByZ = tileRepresentationLookup.representationsByZ;
  const zs = Object.keys(representationsByZ).map(Number).sort(descending);
  for (let j = 0, jj = zs.length; j < jj; ++j) {
    const tileZ = zs[j];
    for (const tileRepresentation of representationsByZ[tileZ]) {
      const tileCoord = tileRepresentation.tile.tileCoord;
      const tileCoordKey = getTileCoordKey(tileCoord);
      if (tileCoordKey in alphaLookup) {
        continue;
      }

      this.drawTile_(
        frameState,
        tileRepresentation,
        tileZ,
        gutter,
        extent,
        alphaLookup,
        tileGrid
      );
    }
  }

  for (const tileRepresentation of representationsByZ[z]) {
    const tileCoord = tileRepresentation.tile.tileCoord;
    const tileCoordKey = getTileCoordKey(tileCoord);
    if (tileCoordKey in alphaLookup) {
      this.drawTile_(
        frameState,
        tileRepresentation,
        z,
        gutter,
        extent,
        alphaLookup,
        tileGrid
      );
    }
  }

  this.helper.finalizeDraw(
    frameState,
    this.dispatchPreComposeEvent,
    this.dispatchPostComposeEvent
  );

  const canvas = this.helper.getCanvas();

  const tileRepresentationCache = this.tileRepresentationCache;
  while (tileRepresentationCache.canExpireCache()) {
    const tileRepresentation = tileRepresentationCache.pop();
    tileRepresentation.dispose();
  }

  // TODO: let the renderers manage their own cache instead of managing the source cache
  /**
   * Here we unconditionally expire the source cache since the renderer maintains
   * its own cache.
   * @param {import("../../Map.js").default} map Map.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   */
  const postRenderFunction = function (map, frameState) {
    tileSource.updateCacheSize(0.1, frameState.viewState.projection);
    tileSource.expireCache(frameState.viewState.projection, empty);
  };

  frameState.postRenderFunctions.push(postRenderFunction);

  this.postRender(gl, frameState);
  return canvas;
}
