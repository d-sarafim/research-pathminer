moveStickyTooltipOverBars(j, capturedSeries) {
  const w = this.w
  const ttCtx = this.ttCtx

  let barLen = w.globals.columnSeries
    ? w.globals.columnSeries.length
    : w.globals.series.length

  let i =
    barLen >= 2 && barLen % 2 === 0
      ? Math.floor(barLen / 2)
      : Math.floor(barLen / 2) + 1

  if (w.globals.isBarHorizontal) {
    let series = new Series(this.ctx)
    i = series.getActiveConfigSeriesIndex('desc') + 1
  }
  let jBar = w.globals.dom.baseEl.querySelector(
    `.apexcharts-bar-series .apexcharts-series[rel='${i}'] path[j='${j}'], .apexcharts-candlestick-series .apexcharts-series[rel='${i}'] path[j='${j}'], .apexcharts-boxPlot-series .apexcharts-series[rel='${i}'] path[j='${j}'], .apexcharts-rangebar-series .apexcharts-series[rel='${i}'] path[j='${j}']`
  )
  if (!jBar && typeof capturedSeries === 'number') {
    // Try with captured series index
    jBar = w.globals.dom.baseEl.querySelector(
      `.apexcharts-bar-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j}'],
      .apexcharts-candlestick-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j}'],
      .apexcharts-boxPlot-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j}'],
      .apexcharts-rangebar-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j}']`
    )
  }

  let bcx = jBar ? parseFloat(jBar.getAttribute('cx')) : 0
  let bcy = jBar ? parseFloat(jBar.getAttribute('cy')) : 0
  let bw = jBar ? parseFloat(jBar.getAttribute('barWidth')) : 0

  const elGrid = ttCtx.getElGrid()
  let seriesBound = elGrid.getBoundingClientRect()

  const isBoxOrCandle =
    jBar &&
    (jBar.classList.contains('apexcharts-candlestick-area') ||
      jBar.classList.contains('apexcharts-boxPlot-area'))
  if (w.globals.isXNumeric) {
    if (jBar && !isBoxOrCandle) {
      bcx = bcx - (barLen % 2 !== 0 ? bw / 2 : 0)
    }

    if (
      jBar && // fixes apexcharts.js#2354
      isBoxOrCandle &&
      w.globals.comboCharts
    ) {
      bcx = bcx - bw / 2
    }
  } else {
    if (!w.globals.isBarHorizontal) {
      bcx =
        ttCtx.xAxisTicksPositions[j - 1] + ttCtx.dataPointsDividedWidth / 2
      if (isNaN(bcx)) {
        bcx = ttCtx.xAxisTicksPositions[j] - ttCtx.dataPointsDividedWidth / 2
      }
    }
  }

  if (!w.globals.isBarHorizontal) {
    if (w.config.tooltip.followCursor) {
      bcy = ttCtx.e.clientY - seriesBound.top - ttCtx.tooltipRect.ttHeight / 2
    } else {
      if (bcy + ttCtx.tooltipRect.ttHeight + 15 > w.globals.gridHeight) {
        bcy = w.globals.gridHeight
      }
    }
  } else {
    bcy = bcy - ttCtx.tooltipRect.ttHeight
  }

  if (!w.globals.isBarHorizontal) {
    this.moveXCrosshairs(bcx)
  }

  if (!ttCtx.fixedTooltip) {
    this.moveTooltip(bcx, bcy || w.globals.gridHeight)
  }
}
