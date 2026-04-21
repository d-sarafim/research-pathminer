isFormatXY() {
  const series = this.w.config.series.slice()

  const sr = new Series(this.ctx)
  this.activeSeriesIndex = sr.getActiveConfigSeriesIndex()

  if (
    typeof series[this.activeSeriesIndex].data !== 'undefined' &&
    series[this.activeSeriesIndex].data.length > 0 &&
    series[this.activeSeriesIndex].data[0] !== null &&
    typeof series[this.activeSeriesIndex].data[0].x !== 'undefined' &&
    series[this.activeSeriesIndex].data[0] !== null
  ) {
    return true
  }
}
