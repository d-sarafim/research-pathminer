request() {
  if (this.switchInProgress || this.active || !this.pdfViewer.pagesCount) {
    return false;
  }

  this._addFullscreenChangeListeners();

  this._setSwitchInProgress();

  this._notifyStateChange();

  if (this.container.requestFullscreen) {
    this.container.requestFullscreen();
  } else if (this.container.mozRequestFullScreen) {
    this.container.mozRequestFullScreen();
  } else if (this.container.webkitRequestFullscreen) {
    this.container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  } else {
    return false;
  }

  this.args = {
    page: this.pdfViewer.currentPageNumber,
    previousScale: this.pdfViewer.currentScaleValue
  };
  return true;
}
