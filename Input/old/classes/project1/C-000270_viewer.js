class DefaultXfaLayerFactory {
  createXfaLayerBuilder(pageDiv, pdfPage) {
    return new XfaLayerBuilder({
      pageDiv,
      pdfPage
    });
  }

}
