enqueueTiles(
  frameState,
  extent,
  initialZ,
  tileRepresentationLookup,
  preload
) {
  const viewState = frameState.viewState;
  const tileLayer = this.getLayer();
  const tileSource = tileLayer.getRenderSource();
  const tileGrid = tileSource.getTileGridForProjection(viewState.projection);
  const gutter = tileSource.getGutterForProjection(viewState.projection);

  const tileSourceKey = getUid(tileSource);
  if (!(tileSourceKey in frameState.wantedTiles)) {
    frameState.wantedTiles[tileSourceKey] = {};
  }

  const wantedTiles = frameState.wantedTiles[tileSourceKey];
  const tileRepresentationCache = this.tileRepresentationCache;

  const map = tileLayer.getMapInternal();
  const minZ = Math.max(
    initialZ - preload,
    tileGrid.getMinZoom(),
    tileGrid.getZForResolution(
      Math.min(
        tileLayer.getMaxResolution(),
        map
          ? map
              .getView()
              .getResolutionForZoom(Math.max(tileLayer.getMinZoom(), 0))
          : tileGrid.getResolution(0)
      ),
      tileSource.zDirection
    )
  );
  for (let z = initialZ; z >= minZ; --z) {
    const tileRange = tileGrid.getTileRangeForExtentAndZ(
      extent,
      z,
      this.tempTileRange_
    );

    const tileResolution = tileGrid.getResolution(z);

    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        const tileCoord = createTileCoord(z, x, y, this.tempTileCoord_);
        const cacheKey = getCacheKey(tileSource, tileCoord);

        /** @type {TileRepresentation} */
        let tileRepresentation;

        /** @type {TileType} */
        let tile;

        if (tileRepresentationCache.containsKey(cacheKey)) {
          tileRepresentation = tileRepresentationCache.get(cacheKey);
          tile = tileRepresentation.tile;
        }
        if (
          !tileRepresentation ||
          tileRepresentation.tile.key !== tileSource.getKey()
        ) {
          tile = tileSource.getTile(
            z,
            x,
            y,
            frameState.pixelRatio,
            viewState.projection
          );
        }

        if (lookupHasTile(tileRepresentationLookup, tile)) {
          continue;
        }

        if (!tileRepresentation) {
          tileRepresentation = this.createTileRepresentation({
            tile: tile,
            grid: tileGrid,
            helper: this.helper,
            gutter: gutter,
          });
          tileRepresentationCache.set(cacheKey, tileRepresentation);
        } else {
          if (this.isDrawableTile_(tile)) {
            tileRepresentation.setTile(tile);
          } else {
            const interimTile = /** @type {TileType} */ (
              tile.getInterimTile()
            );
            tileRepresentation.setTile(interimTile);
          }
        }

        addTileRepresentationToLookup(
          tileRepresentationLookup,
          tileRepresentation,
          z
        );

        const tileQueueKey = tile.getKey();
        wantedTiles[tileQueueKey] = true;

        if (tile.getState() === TileState.IDLE) {
          if (!frameState.tileQueue.isKeyQueued(tileQueueKey)) {
            frameState.tileQueue.enqueue([
              tile,
              tileSourceKey,
              tileGrid.getTileCoordCenter(tileCoord),
              tileResolution,
            ]);
          }
        }
      }
    }
  }
}
