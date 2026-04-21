getPixelRatio(pixelRatio) {
  this.replaceColor_(pixelRatio);
  return this.canvas_[pixelRatio] ? pixelRatio : 1;
}
