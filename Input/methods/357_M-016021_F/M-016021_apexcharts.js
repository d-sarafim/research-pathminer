getHighestValueInSeries(seriesIndex = 0) {
  const range = new Range(this.ctx)
  return range.getMinYMaxY(seriesIndex).highestY
}
