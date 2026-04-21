constructor(chart, datasetIndex) {
  this.chart = chart;
  this._ctx = chart.ctx;
  this.index = datasetIndex;
  this._cachedDataOpts = {};
  this._cachedMeta = this.getMeta();
  this._type = this._cachedMeta.type;
  this.options = undefined;
  /** @type {boolean | object} */
  this._parsing = false;
  this._data = undefined;
  this._objectData = undefined;
  this._sharedOptions = undefined;
  this._drawStart = undefined;
  this._drawCount = undefined;
  this.enableOptionSharing = false;
  this.supportsDecimation = false;
  this.$context = undefined;
  this._syncList = [];
  this.datasetElementType = new.target.datasetElementType;
  this.dataElementType = new.target.dataElementType;

  this.initialize();
}
