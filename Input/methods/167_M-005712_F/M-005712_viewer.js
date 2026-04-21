setPageNumber(pageNumber, pageLabel) {
  this.pageNumber = pageNumber;
  this.pageLabel = pageLabel;

  this._updateUIState(false);
}
