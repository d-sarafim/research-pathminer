async _currentOutlineItem() {
  if (!this._isPagesLoaded) {
    throw new Error("_currentOutlineItem: All pages have not been loaded.");
  }

  if (!this._outline || !this._pdfDocument) {
    return;
  }

  const pageNumberToDestHash = await this._getPageNumberToDestHash(this._pdfDocument);

  if (!pageNumberToDestHash) {
    return;
  }

  this._updateCurrentTreeItem(null);

  if (this._sidebarView !== _ui_utils.SidebarView.OUTLINE) {
    return;
  }

  for (let i = this._currentPageNumber; i > 0; i--) {
    const destHash = pageNumberToDestHash.get(i);

    if (!destHash) {
      continue;
    }

    const linkElement = this.container.querySelector(`a[href="${destHash}"]`);

    if (!linkElement) {
      continue;
    }

    this._scrollToCurrentTreeItem(linkElement.parentNode);

    break;
  }
}
