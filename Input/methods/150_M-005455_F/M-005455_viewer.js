executeNamedAction(action) {
  switch (action) {
    case "GoBack":
      if (this.pdfHistory) {
        this.pdfHistory.back();
      }

      break;

    case "GoForward":
      if (this.pdfHistory) {
        this.pdfHistory.forward();
      }

      break;

    case "NextPage":
      this.pdfViewer.nextPage();
      break;

    case "PrevPage":
      this.pdfViewer.previousPage();
      break;

    case "LastPage":
      this.page = this.pagesCount;
      break;

    case "FirstPage":
      this.page = 1;
      break;

    default:
      break;
  }

  this.eventBus.dispatch("namedaction", {
    source: this,
    action
  });
}
