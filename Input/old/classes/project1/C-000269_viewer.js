class XfaLayerBuilder {
  constructor({
    pageDiv,
    pdfPage
  }) {
    this.pageDiv = pageDiv;
    this.pdfPage = pdfPage;
    this.div = null;
    this._cancelled = false;
  }

  render(viewport, intent = "display") {
    return this.pdfPage.getXfa().then(xfa => {
      if (this._cancelled) {
        return;
      }

      const parameters = {
        viewport: viewport.clone({
          dontFlip: true
        }),
        div: this.div,
        xfa,
        page: this.pdfPage
      };

      if (this.div) {
        _pdfjsLib.XfaLayer.update(parameters);
      } else {
        this.div = document.createElement("div");
        this.pageDiv.appendChild(this.div);
        parameters.div = this.div;

        _pdfjsLib.XfaLayer.render(parameters);
      }
    });
  }

  cancel() {
    this._cancelled = true;
  }

  hide() {
    if (!this.div) {
      return;
    }

    this.div.hidden = true;
  }

}
