getMaxOverflow() {
  const meta = this._cachedMeta;
  const data = meta.data || [];

  if (!this.options.showLine) {
    let max = 0;
    for (let i = data.length - 1; i >= 0; --i) {
      max = Math.max(max, data[i].size(this.resolveDataElementOptions(i)) / 2);
    }
    return max > 0 && max;
  }

  const dataset = meta.dataset;
  const border = dataset.options && dataset.options.borderWidth || 0;

  if (!data.length) {
    return border;
  }

  const firstPoint = data[0].size(this.resolveDataElementOptions(0));
  const lastPoint = data[data.length - 1].size(this.resolveDataElementOptions(data.length - 1));
  return Math.max(border, firstPoint, lastPoint) / 2;
}
