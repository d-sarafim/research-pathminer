getData(pixel) {
  const gl = this.helper.getGL();
  if (!gl) {
    return null;
  }

  const frameState = this.frameState;
  if (!frameState) {
    return null;
  }

  const layer = this.getLayer();
  const coordinate = applyTransform(
    frameState.pixelToCoordinateTransform,
    pixel.slice()
  );

  const viewState = frameState.viewState;
  const layerExtent = layer.getExtent();
  if (layerExtent) {
    if (
      !containsCoordinate(
        fromUserExtent(layerExtent, viewState.projection),
        coordinate
      )
    ) {
      return null;
    }
  }

  // determine last source suitable for rendering at coordinate
  const sources = layer.getSources(
    boundingExtent([coordinate]),
    viewState.resolution
  );
  let i, source, tileGrid;
  for (i = sources.length - 1; i >= 0; --i) {
    source = sources[i];
    if (source.getState() === 'ready') {
      tileGrid = source.getTileGridForProjection(viewState.projection);
      if (source.getWrapX()) {
        break;
      }
      const gridExtent = tileGrid.getExtent();
      if (!gridExtent || containsCoordinate(gridExtent, coordinate)) {
        break;
      }
    }
  }
  if (i < 0) {
    return null;
  }

  const tileTextureCache = this.tileRepresentationCache;
  for (
    let z = tileGrid.getZForResolution(viewState.resolution);
    z >= tileGrid.getMinZoom();
    --z
  ) {
    const tileCoord = tileGrid.getTileCoordForCoordAndZ(coordinate, z);
    const cacheKey = getCacheKey(source, tileCoord);
    if (!tileTextureCache.containsKey(cacheKey)) {
      continue;
    }
    const tileTexture = tileTextureCache.get(cacheKey);
    const tile = tileTexture.tile;
    if (
      (tile instanceof ReprojTile || tile instanceof ReprojDataTile) &&
      tile.getState() === TileState.EMPTY
    ) {
      return null;
    }
    if (!tileTexture.loaded) {
      continue;
    }
    const tileOrigin = tileGrid.getOrigin(z);
    const tileSize = toSize(tileGrid.getTileSize(z));
    const tileResolution = tileGrid.getResolution(z);

    const col =
      (coordinate[0] - tileOrigin[0]) / tileResolution -
      tileCoord[1] * tileSize[0];

    const row =
      (tileOrigin[1] - coordinate[1]) / tileResolution -
      tileCoord[2] * tileSize[1];

    return tileTexture.getPixelData(col, row);
  }
  return null;
}
