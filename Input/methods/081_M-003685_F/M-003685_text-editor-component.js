getFirstVisibleRow() {
  if (this.derivedDimensionsCache.firstVisibleRow == null) {
    this.derivedDimensionsCache.firstVisibleRow = this.rowForPixelPosition(
      this.getScrollTop()
    );
  }

  return this.derivedDimensionsCache.firstVisibleRow;
}
