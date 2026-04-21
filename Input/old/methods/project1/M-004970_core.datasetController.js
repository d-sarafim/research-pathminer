getContext(index, active, mode) {
  const dataset = this.getDataset();
  let context;
  if (index >= 0 && index < this._cachedMeta.data.length) {
    const element = this._cachedMeta.data[index];
    context = element.$context ||
      (element.$context = createDataContext(this.getContext(), index, element));
    context.parsed = this.getParsed(index);
    context.raw = dataset.data[index];
    context.index = context.dataIndex = index;
  } else {
    context = this.$context ||
      (this.$context = createDatasetContext(this.chart.getContext(), this.index));
    context.dataset = dataset;
    context.index = context.datasetIndex = this.index;
  }

  context.active = !!active;
  context.mode = mode;
  return context;
}
