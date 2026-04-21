recalcDimensionsBasedOnFormat(filteredTimeScale, inverted) {
  const w = this.w
  const reformattedTimescaleArray = this.formatDates(filteredTimeScale)

  const removedOverlappingTS = this.removeOverlappingTS(
    reformattedTimescaleArray
  )

  w.globals.timescaleLabels = removedOverlappingTS.slice()

  // at this stage, we need to re-calculate coords of the grid as timeline labels may have altered the xaxis labels coords
  // The reason we can't do this prior to this stage is because timeline labels depends on gridWidth, and as the ticks are calculated based on available gridWidth, there can be unknown number of ticks generated for different minX and maxX
  // Dependency on Dimensions(), need to refactor correctly
  // TODO - find an alternate way to avoid calling this Heavy method twice
  let dimensions = new Dimensions(this.ctx)
  dimensions.plotCoords()
}
