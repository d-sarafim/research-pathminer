renderFrame_(time) {
  const size = this.getSize();
  const view = this.getView();
  const previousFrameState = this.frameState_;
  /** @type {?FrameState} */
  let frameState = null;
  if (size !== undefined && hasArea(size) && view && view.isDef()) {
    const viewHints = view.getHints(
      this.frameState_ ? this.frameState_.viewHints : undefined
    );
    const viewState = view.getState();
    frameState = {
      animate: false,
      coordinateToPixelTransform: this.coordinateToPixelTransform_,
      declutterTree: null,
      extent: getForViewAndSize(
        viewState.center,
        viewState.resolution,
        viewState.rotation,
        size
      ),
      index: this.frameIndex_++,
      layerIndex: 0,
      layerStatesArray: this.getLayerGroup().getLayerStatesArray(),
      pixelRatio: this.pixelRatio_,
      pixelToCoordinateTransform: this.pixelToCoordinateTransform_,
      postRenderFunctions: [],
      size: size,
      tileQueue: this.tileQueue_,
      time: time,
      usedTiles: {},
      viewState: viewState,
      viewHints: viewHints,
      wantedTiles: {},
      mapId: getUid(this),
      renderTargets: {},
    };
    if (viewState.nextCenter && viewState.nextResolution) {
      const rotation = isNaN(viewState.nextRotation)
        ? viewState.rotation
        : viewState.nextRotation;

      frameState.nextExtent = getForViewAndSize(
        viewState.nextCenter,
        viewState.nextResolution,
        rotation,
        size
      );
    }
  }

  this.frameState_ = frameState;
  this.renderer_.renderFrame(frameState);

  if (frameState) {
    if (frameState.animate) {
      this.render();
    }
    Array.prototype.push.apply(
      this.postRenderFunctions_,
      frameState.postRenderFunctions
    );

    if (previousFrameState) {
      const moveStart =
        !this.previousExtent_ ||
        (!isEmpty(this.previousExtent_) &&
          !equalsExtent(frameState.extent, this.previousExtent_));
      if (moveStart) {
        this.dispatchEvent(
          new MapEvent(MapEventType.MOVESTART, this, previousFrameState)
        );
        this.previousExtent_ = createOrUpdateEmpty(this.previousExtent_);
      }
    }

    const idle =
      this.previousExtent_ &&
      !frameState.viewHints[ViewHint.ANIMATING] &&
      !frameState.viewHints[ViewHint.INTERACTING] &&
      !equalsExtent(frameState.extent, this.previousExtent_);

    if (idle) {
      this.dispatchEvent(
        new MapEvent(MapEventType.MOVEEND, this, frameState)
      );
      clone(frameState.extent, this.previousExtent_);
    }
  }

  this.dispatchEvent(new MapEvent(MapEventType.POSTRENDER, this, frameState));

  this.renderComplete_ =
    this.hasListener(MapEventType.LOADSTART) ||
    this.hasListener(MapEventType.LOADEND) ||
    this.hasListener(RenderEventType.RENDERCOMPLETE)
      ? !this.tileQueue_.getTilesLoading() &&
        !this.tileQueue_.getCount() &&
        !this.getLoadingOrNotReady()
      : undefined;

  if (!this.postRenderTimeoutHandle_) {
    this.postRenderTimeoutHandle_ = setTimeout(() => {
      this.postRenderTimeoutHandle_ = undefined;
      this.handlePostRender();
    }, 0);
  }
}
