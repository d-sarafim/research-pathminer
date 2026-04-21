_resyncElements(resetNewElements) {
  const data = this._data;
  const elements = this._cachedMeta.data;

  // Apply changes detected through array listeners
  for (const [method, arg1, arg2] of this._syncList) {
    this[method](arg1, arg2);
  }
  this._syncList = [];

  const numMeta = elements.length;
  const numData = data.length;
  const count = Math.min(numData, numMeta);

  if (count) {
    // TODO: It is not optimal to always parse the old data
    // This is done because we are not detecting direct assignments:
    // chart.data.datasets[0].data[5] = 10;
    // chart.data.datasets[0].data[5].y = 10;
    this.parse(0, count);
  }

  if (numData > numMeta) {
    this._insertElements(numMeta, numData - numMeta, resetNewElements);
  } else if (numData < numMeta) {
    this._removeElements(numData, numMeta - numData);
  }
}
