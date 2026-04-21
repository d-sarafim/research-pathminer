updateExecutorGroup_(tile, pixelRatio, projection) {
  const layer = /** @type {import("../../layer/VectorTile.js").default} */ (
    this.getLayer()
  );
  const revision = layer.getRevision();
  const renderOrder = layer.getRenderOrder() || null;

  const resolution = tile.wantedResolution;
  const builderState = tile.getReplayState(layer);
  if (
    !builderState.dirty &&
    builderState.renderedResolution === resolution &&
    builderState.renderedRevision == revision &&
    builderState.renderedRenderOrder == renderOrder
  ) {
    return;
  }

  const source = layer.getSource();
  const declutter = layer.getDeclutter();
  const sourceTileGrid = source.getTileGrid();
  const tileGrid = source.getTileGridForProjection(projection);
  const tileExtent = tileGrid.getTileCoordExtent(tile.wrappedTileCoord);

  const sourceTiles = source.getSourceTiles(pixelRatio, projection, tile);
  const layerUid = getUid(layer);
  delete tile.hitDetectionImageData[layerUid];
  tile.executorGroups[layerUid] = [];
  if (declutter) {
    tile.declutterExecutorGroups[layerUid] = [];
  }
  builderState.dirty = false;
  for (let t = 0, tt = sourceTiles.length; t < tt; ++t) {
    const sourceTile = sourceTiles[t];
    if (sourceTile.getState() != TileState.LOADED) {
      continue;
    }
    const sourceTileCoord = sourceTile.tileCoord;
    const sourceTileExtent =
      sourceTileGrid.getTileCoordExtent(sourceTileCoord);
    const sharedExtent = getIntersection(tileExtent, sourceTileExtent);
    const builderExtent = buffer(
      sharedExtent,
      layer.getRenderBuffer() * resolution,
      this.tmpExtent
    );
    const bufferedExtent = equals(sourceTileExtent, sharedExtent)
      ? null
      : builderExtent;
    const builderGroup = new CanvasBuilderGroup(
      0,
      builderExtent,
      resolution,
      pixelRatio
    );
    const declutterBuilderGroup = declutter
      ? new CanvasBuilderGroup(0, sharedExtent, resolution, pixelRatio)
      : undefined;
    const squaredTolerance = getSquaredRenderTolerance(
      resolution,
      pixelRatio
    );

    /**
     * @param {import("../../Feature.js").FeatureLike} feature Feature.
     * @this {CanvasVectorTileLayerRenderer}
     */
    const render = function (feature) {
      let styles;
      const styleFunction =
        feature.getStyleFunction() || layer.getStyleFunction();
      if (styleFunction) {
        styles = styleFunction(feature, resolution);
      }
      if (styles) {
        const dirty = this.renderFeature(
          feature,
          squaredTolerance,
          styles,
          builderGroup,
          declutterBuilderGroup
        );
        builderState.dirty = builderState.dirty || dirty;
      }
    };

    const features = sourceTile.getFeatures();
    if (renderOrder && renderOrder !== builderState.renderedRenderOrder) {
      features.sort(renderOrder);
    }
    for (let i = 0, ii = features.length; i < ii; ++i) {
      const feature = features[i];
      if (
        !bufferedExtent ||
        intersects(bufferedExtent, feature.getGeometry().getExtent())
      ) {
        render.call(this, feature);
      }
    }
    const executorGroupInstructions = builderGroup.finish();
    // no need to clip when the render tile is covered by a single source tile
    const replayExtent =
      layer.getRenderMode() !== 'vector' &&
      declutter &&
      sourceTiles.length === 1
        ? null
        : sharedExtent;
    const renderingReplayGroup = new CanvasExecutorGroup(
      replayExtent,
      resolution,
      pixelRatio,
      source.getOverlaps(),
      executorGroupInstructions,
      layer.getRenderBuffer()
    );
    tile.executorGroups[layerUid].push(renderingReplayGroup);
    if (declutterBuilderGroup) {
      const declutterExecutorGroup = new CanvasExecutorGroup(
        null,
        resolution,
        pixelRatio,
        source.getOverlaps(),
        declutterBuilderGroup.finish(),
        layer.getRenderBuffer()
      );
      tile.declutterExecutorGroups[layerUid].push(declutterExecutorGroup);
    }
  }
  builderState.renderedRevision = revision;
  builderState.renderedRenderOrder = renderOrder;
  builderState.renderedResolution = resolution;
}
