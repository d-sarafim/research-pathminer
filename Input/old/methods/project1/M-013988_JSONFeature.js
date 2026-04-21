readFeature(source, options) {
  return this.readFeatureFromObject(
    getObject(source),
    this.getReadOptions(source, options)
  );
}
