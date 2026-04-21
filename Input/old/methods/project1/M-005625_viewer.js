isPageCached(pageNumber) {
  if (!this.pdfDocument || !this._buffer) {
    return false;
  }

  if (!(Number.isInteger(pageNumber) && pageNumber > 0 && pageNumber <= this.pagesCount)) {
    console.error(`${this._name}.isPageCached: "${pageNumber}" is not a valid page.`);
    return false;
  }

  const pageView = this._pages[pageNumber - 1];

  if (!pageView) {
    return false;
  }

  return this._buffer.has(pageView);
}
