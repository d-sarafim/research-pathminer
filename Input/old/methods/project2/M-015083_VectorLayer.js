prepareFrame(frameState) {
  const vectorLayer = this.getLayer();
  const vectorSource = vectorLayer.getSource();
  if (!vectorSource) {
    return false;
  }

  const animating = frameState.viewHints[ViewHint.ANIMATING];
  const interacting = frameState.viewHints[ViewHint.INTERACTING];
  const updateWhileAnimating = vectorLayer.getUpdateWhileAnimating();
  const updateWhileInteracting = vectorLayer.getUpdateWhileInteracting();

  if (
    (this.ready && !updateWhileAnimating && animating) ||
    (!updateWhileInteracting && interacting)
  ) {
    this.animatingOrInteracting_ = true;
    return true;
  }
  this.animatingOrInteracting_ = false;

  const frameStateExtent = frameState.extent;
  const viewState = frameState.viewState;
  const projection = viewState.projection;
  const resolution = viewState.resolution;
  const pixelRatio = frameState.pixelRatio;
  const vectorLayerRevision = vectorLayer.getRevision();
  const vectorLayerRenderBuffer = vectorLayer.getRenderBuffer();
  let vectorLayerRenderOrder = vectorLayer.getRenderOrder();

  if (vectorLayerRenderOrder === undefined) {
    vectorLayerRenderOrder = defaultRenderOrder;
  }

  const center = viewState.center.slice();
  const extent = buffer(
    frameStateExtent,
    vectorLayerRenderBuffer * resolution
  );
  const renderedExtent = extent.slice();
  const loadExtents = [extent.slice()];
  const projectionExtent = projection.getExtent();

  if (
    vectorSource.getWrapX() &&
    projection.canWrapX() &&
    !containsExtent(projectionExtent, frameState.extent)
  ) {
    // For the replay group, we need an extent that intersects the real world
    // (-180° to +180°). To support geometries in a coordinate range from -540°
    // to +540°, we add at least 1 world width on each side of the projection
    // extent. If the viewport is wider than the world, we need to add half of
    // the viewport width to make sure we cover the whole viewport.
    const worldWidth = getWidth(projectionExtent);
    const gutter = Math.max(getWidth(extent) / 2, worldWidth);
    extent[0] = projectionExtent[0] - gutter;
    extent[2] = projectionExtent[2] + gutter;
    wrapCoordinateX(center, projection);
    const loadExtent = wrapExtentX(loadExtents[0], projection);
    // If the extent crosses the date line, we load data for both edges of the worlds
    if (
      loadExtent[0] < projectionExtent[0] &&
      loadExtent[2] < projectionExtent[2]
    ) {
      loadExtents.push([
        loadExtent[0] + worldWidth,
        loadExtent[1],
        loadExtent[2] + worldWidth,
        loadExtent[3],
      ]);
    } else if (
      loadExtent[0] > projectionExtent[0] &&
      loadExtent[2] > projectionExtent[2]
    ) {
      loadExtents.push([
        loadExtent[0] - worldWidth,
        loadExtent[1],
        loadExtent[2] - worldWidth,
        loadExtent[3],
      ]);
    }
  }

  if (
    this.ready &&
    this.renderedResolution_ == resolution &&
    this.renderedRevision_ == vectorLayerRevision &&
    this.renderedRenderOrder_ == vectorLayerRenderOrder &&
    containsExtent(this.wrappedRenderedExtent_, extent)
  ) {
    if (!equals(this.renderedExtent_, renderedExtent)) {
      this.hitDetectionImageData_ = null;
      this.renderedExtent_ = renderedExtent;
    }
    this.renderedCenter_ = center;
    this.replayGroupChanged = false;
    return true;
  }

  this.replayGroup_ = null;

  const replayGroup = new CanvasBuilderGroup(
    getRenderTolerance(resolution, pixelRatio),
    extent,
    resolution,
    pixelRatio
  );

  let declutterBuilderGroup;
  if (this.getLayer().getDeclutter()) {
    declutterBuilderGroup = new CanvasBuilderGroup(
      getRenderTolerance(resolution, pixelRatio),
      extent,
      resolution,
      pixelRatio
    );
  }

  const userProjection = getUserProjection();
  let userTransform;
  if (userProjection) {
    for (let i = 0, ii = loadExtents.length; i < ii; ++i) {
      const extent = loadExtents[i];
      const userExtent = toUserExtent(extent, projection);
      vectorSource.loadFeatures(
        userExtent,
        toUserResolution(resolution, projection),
        userProjection
      );
    }
    userTransform = getTransformFromProjections(userProjection, projection);
  } else {
    for (let i = 0, ii = loadExtents.length; i < ii; ++i) {
      vectorSource.loadFeatures(loadExtents[i], resolution, projection);
    }
  }

  const squaredTolerance = getSquaredRenderTolerance(resolution, pixelRatio);
  let ready = true;
  const render =
    /**
     * @param {import("../../Feature.js").default} feature Feature.
     */
    (feature) => {
      let styles;
      const styleFunction =
        feature.getStyleFunction() || vectorLayer.getStyleFunction();
      if (styleFunction) {
        styles = styleFunction(feature, resolution);
      }
      if (styles) {
        const dirty = this.renderFeature(
          feature,
          squaredTolerance,
          styles,
          replayGroup,
          userTransform,
          declutterBuilderGroup
        );
        ready = ready && !dirty;
      }
    };

  const userExtent = toUserExtent(extent, projection);
  /** @type {Array<import("../../Feature.js").default>} */
  const features = vectorSource.getFeaturesInExtent(userExtent);
  if (vectorLayerRenderOrder) {
    features.sort(vectorLayerRenderOrder);
  }
  for (let i = 0, ii = features.length; i < ii; ++i) {
    render(features[i]);
  }
  this.renderedFeatures_ = features;
  this.ready = ready;

  const replayGroupInstructions = replayGroup.finish();
  const executorGroup = new ExecutorGroup(
    extent,
    resolution,
    pixelRatio,
    vectorSource.getOverlaps(),
    replayGroupInstructions,
    vectorLayer.getRenderBuffer()
  );

  if (declutterBuilderGroup) {
    this.declutterExecutorGroup = new ExecutorGroup(
      extent,
      resolution,
      pixelRatio,
      vectorSource.getOverlaps(),
      declutterBuilderGroup.finish(),
      vectorLayer.getRenderBuffer()
    );
  }

  this.renderedResolution_ = resolution;
  this.renderedRevision_ = vectorLayerRevision;
  this.renderedRenderOrder_ = vectorLayerRenderOrder;
  this.renderedExtent_ = renderedExtent;
  this.wrappedRenderedExtent_ = extent;
  this.renderedCenter_ = center;
  this.renderedProjection_ = projection;
  this.replayGroup_ = executorGroup;
  this.hitDetectionImageData_ = null;

  this.replayGroupChanged = true;
  return true;
}
