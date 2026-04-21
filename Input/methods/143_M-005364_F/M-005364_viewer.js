_reset() {
  this.pdfDocument = null;
  this.url = null;
  delete this.fieldData;
  this._dataAvailableCapability = (0, _pdfjsLib.createPromiseCapability)();
  this._currentPageNumber = 1;
  this._pagesRotation = 0;
}
