_descriptors(chart) {
  if (this._cache) {
    return this._cache;
  }

  const descriptors = this._cache = this._createDescriptors(chart);

  this._notifyStateChanges(chart);

  return descriptors;
}
