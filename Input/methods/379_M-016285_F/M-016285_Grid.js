gridPadForColumnsInNumericAxis(gridWidth) {
  const w = this.w

  if (w.globals.noData || w.globals.allSeriesCollapsed) {
    return 0
  }

  const hasBar = (type) => {
    return (
      type === 'bar' ||
      type === 'rangeBar' ||
      type === 'candlestick' ||
      type === 'boxPlot'
    )
  }

  const type = w.config.chart.type

  let barWidth = 0
  let seriesLen = hasBar(type) ? w.config.series.length : 1

  if (w.globals.comboBarCount > 0) {
    seriesLen = w.globals.comboBarCount
  }
  w.globals.collapsedSeries.forEach((c) => {
    if (hasBar(c.type)) {
      seriesLen = seriesLen - 1
    }
  })
  if (w.config.chart.stacked) {
    seriesLen = 1
  }

  const barsPresent = hasBar(type) || w.globals.comboBarCount > 0

  if (
    barsPresent &&
    w.globals.isXNumeric &&
    !w.globals.isBarHorizontal &&
    seriesLen > 0
  ) {
    let xRatio = 0
    let xRange = Math.abs(w.globals.initialMaxX - w.globals.initialMinX)

    if (xRange <= 3) {
      xRange = w.globals.dataPoints
    }

    xRatio = xRange / gridWidth

    let xDivision
    // max barwidth should be equal to minXDiff to avoid overlap
    if (w.globals.minXDiff && w.globals.minXDiff / xRatio > 0) {
      xDivision = w.globals.minXDiff / xRatio
    }

    if (xDivision > gridWidth / 2) {
      xDivision = xDivision / 2
    }
    barWidth =
      ((xDivision / seriesLen) *
        parseInt(w.config.plotOptions.bar.columnWidth, 10)) /
      100

    if (barWidth < 1) {
      barWidth = 1
    }

    barWidth = barWidth / (seriesLen > 1 ? 1 : 1.5) + 5

    w.globals.barPadForNumericAxis = barWidth
  }
  return barWidth
}
