getDistanceFromCenterForValue(value) {
  if (isNullOrUndef(value)) {
    return NaN;
  }

  // Take into account half font size + the yPadding of the top value
  const scalingFactor = this.drawingArea / (this.max - this.min);
  if (this.options.reverse) {
    return (this.max - value) * scalingFactor;
  }
  return (value - this.min) * scalingFactor;
}
