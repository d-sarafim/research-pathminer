readProjection(source) {
  const view = this.viewCache_ || getDataView(source);
  if (!view) {
    return undefined;
  }

  const reader = new WkbReader(view);
  reader.readWkbHeader();

  return (
    (reader.getSrid() && getProjection('EPSG:' + reader.getSrid())) ||
    undefined
  );
}
