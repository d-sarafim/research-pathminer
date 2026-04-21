nextPage() {
  const currentPageNumber = this._currentPageNumber,
        pagesCount = this.pagesCount;

  if (currentPageNumber >= pagesCount) {
    return false;
  }

  const advance = this._getPageAdvance(currentPageNumber, false) || 1;
  this.currentPageNumber = Math.min(currentPageNumber + advance, pagesCount);
  return true;
}
