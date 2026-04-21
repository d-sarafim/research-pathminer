_resetView() {
  super._resetView();

  this._previousPageNumber = 1;
  this._shadowViewer = document.createDocumentFragment();
  this._updateScrollDown = null;
}
