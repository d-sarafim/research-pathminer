animateInternal(var_args) {
  let animationCount = arguments.length;
  let callback;
  if (
    animationCount > 1 &&
    typeof arguments[animationCount - 1] === 'function'
  ) {
    callback = arguments[animationCount - 1];
    --animationCount;
  }

  let i = 0;
  for (; i < animationCount && !this.isDef(); ++i) {
    // if view properties are not yet set, shortcut to the final state
    const state = arguments[i];
    if (state.center) {
      this.setCenterInternal(state.center);
    }
    if (state.zoom !== undefined) {
      this.setZoom(state.zoom);
    } else if (state.resolution) {
      this.setResolution(state.resolution);
    }
    if (state.rotation !== undefined) {
      this.setRotation(state.rotation);
    }
  }
  if (i === animationCount) {
    if (callback) {
      animationCallback(callback, true);
    }
    return;
  }

  let start = Date.now();
  let center = this.targetCenter_.slice();
  let resolution = this.targetResolution_;
  let rotation = this.targetRotation_;
  const series = [];
  for (; i < animationCount; ++i) {
    const options = /** @type {AnimationOptions} */ (arguments[i]);

    const animation = {
      start: start,
      complete: false,
      anchor: options.anchor,
      duration: options.duration !== undefined ? options.duration : 1000,
      easing: options.easing || inAndOut,
      callback: callback,
    };

    if (options.center) {
      animation.sourceCenter = center;
      animation.targetCenter = options.center.slice();
      center = animation.targetCenter;
    }

    if (options.zoom !== undefined) {
      animation.sourceResolution = resolution;
      animation.targetResolution = this.getResolutionForZoom(options.zoom);
      resolution = animation.targetResolution;
    } else if (options.resolution) {
      animation.sourceResolution = resolution;
      animation.targetResolution = options.resolution;
      resolution = animation.targetResolution;
    }

    if (options.rotation !== undefined) {
      animation.sourceRotation = rotation;
      const delta =
        modulo(options.rotation - rotation + Math.PI, 2 * Math.PI) - Math.PI;
      animation.targetRotation = rotation + delta;
      rotation = animation.targetRotation;
    }

    // check if animation is a no-op
    if (isNoopAnimation(animation)) {
      animation.complete = true;
      // we still push it onto the series for callback handling
    } else {
      start += animation.duration;
    }
    series.push(animation);
  }
  this.animations_.push(series);
  this.setHint(ViewHint.ANIMATING, 1);
  this.updateAnimations_();
}
