buildTicks() {
  const opts = this.options;
  const tickOpts = opts.ticks;

  // Figure out what the max number of ticks we can support it is based on the size of
  // the axis area. For now, we say that the minimum tick spacing in pixels must be 40
  // We also limit the maximum number of ticks to 11 which gives a nice 10 squares on
  // the graph. Make sure we always have at least 2 ticks
  let maxTicks = this.getTickLimit();
  maxTicks = Math.max(2, maxTicks);

  const numericGeneratorOptions = {
    maxTicks,
    bounds: opts.bounds,
    min: opts.min,
    max: opts.max,
    precision: tickOpts.precision,
    step: tickOpts.stepSize,
    count: tickOpts.count,
    maxDigits: this._maxDigits(),
    horizontal: this.isHorizontal(),
    minRotation: tickOpts.minRotation || 0,
    includeBounds: tickOpts.includeBounds !== false
  };
  const dataRange = this._range || this;
  const ticks = generateTicks(numericGeneratorOptions, dataRange);

  // At this point, we need to update our max and min given the tick values,
  // since we probably have expanded the range of the scale
  if (opts.bounds === 'ticks') {
    _setMinAndMaxByKey(ticks, this, 'value');
  }

  if (opts.reverse) {
    ticks.reverse();

    this.start = this.max;
    this.end = this.min;
  } else {
    this.start = this.min;
    this.end = this.max;
  }

  return ticks;
}
