_ensurePageViewVisible() {
  const pageView = this._pages[this._currentPageNumber - 1];
  const previousPageView = this._pages[this._previousPageNumber - 1];
  const viewerNodes = this.viewer.childNodes;

  switch (viewerNodes.length) {
    case 0:
      this.viewer.appendChild(pageView.div);
      break;

    case 1:
      if (viewerNodes[0] !== previousPageView.div) {
        throw new Error("_ensurePageViewVisible: Unexpected previously visible page.");
      }

      if (pageView === previousPageView) {
        break;
      }

      this._shadowViewer.appendChild(previousPageView.div);

      this.viewer.appendChild(pageView.div);
      this.container.scrollTop = 0;
      break;

    default:
      throw new Error("_ensurePageViewVisible: Only one page should be visible at a time.");
  }

  this._previousPageNumber = this._currentPageNumber;
}
