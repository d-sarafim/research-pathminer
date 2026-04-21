setDefaultCharWidth(
  defaultCharWidth,
  doubleWidthCharWidth,
  halfWidthCharWidth,
  koreanCharWidth
) {
  if (doubleWidthCharWidth == null) {
    doubleWidthCharWidth = defaultCharWidth;
  }
  if (halfWidthCharWidth == null) {
    halfWidthCharWidth = defaultCharWidth;
  }
  if (koreanCharWidth == null) {
    koreanCharWidth = defaultCharWidth;
  }
  if (
    defaultCharWidth !== this.defaultCharWidth ||
    (doubleWidthCharWidth !== this.doubleWidthCharWidth &&
      halfWidthCharWidth !== this.halfWidthCharWidth &&
      koreanCharWidth !== this.koreanCharWidth)
  ) {
    this.defaultCharWidth = defaultCharWidth;
    this.doubleWidthCharWidth = doubleWidthCharWidth;
    this.halfWidthCharWidth = halfWidthCharWidth;
    this.koreanCharWidth = koreanCharWidth;
    if (this.isSoftWrapped()) {
      this.displayLayer.reset({
        softWrapColumn: this.getSoftWrapColumn()
      });
    }
  }
  return defaultCharWidth;
}
