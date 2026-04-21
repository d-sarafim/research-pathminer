update(mode) {
  const meta = this._cachedMeta;
  const {data: points = []} = meta;
  // @ts-ignore
  const animationsDisabled = this.chart._animationsDisabled;
  let {start, count} = _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled);

  this._drawStart = start;
  this._drawCount = count;

  if (_scaleRangesChanged(meta)) {
    start = 0;
    count = points.length;
  }

  if (this.options.showLine) {

    // https://github.com/chartjs/Chart.js/issues/11333
    if (!this.datasetElementType) {
      this.addElements();
    }
    const {dataset: line, _dataset} = meta;

    // Update Line
    line._chart = this.chart;
    line._datasetIndex = this.index;
    line._decimated = !!_dataset._decimated;
    line.points = points;

    const options = this.resolveDatasetElementOptions(mode);
    options.segment = this.options.segment;
    this.updateElement(line, undefined, {
      animated: !animationsDisabled,
      options
    }, mode);
  } else if (this.datasetElementType) {
    // https://github.com/chartjs/Chart.js/issues/11333
    delete meta.dataset;
    this.datasetElementType = false;
  }

  // Update Points
  this.updateElements(points, start, count, mode);
}
