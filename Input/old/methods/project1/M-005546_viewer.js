_updateWidth(width = 0) {
  const maxWidth = Math.floor(this.outerContainerWidth / 2);

  if (width > maxWidth) {
    width = maxWidth;
  }

  if (width < SIDEBAR_MIN_WIDTH) {
    width = SIDEBAR_MIN_WIDTH;
  }

  if (width === this._width) {
    return false;
  }

  this._width = width;
  this.doc.style.setProperty(SIDEBAR_WIDTH_VAR, `${width}px`);
  return true;
}
