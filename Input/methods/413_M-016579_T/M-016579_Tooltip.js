addSVGEvents() {
  const w = this.w
  let type = w.config.chart.type
  const tooltipEl = this.getElTooltip()

  const commonBar = !!(
    type === 'bar' ||
    type === 'candlestick' ||
    type === 'boxPlot' ||
    type === 'rangeBar'
  )

  const chartWithmarkers =
    type === 'area' ||
    type === 'line' ||
    type === 'scatter' ||
    type === 'bubble' ||
    type === 'radar'

  let hoverArea = w.globals.dom.Paper.node

  const elGrid = this.getElGrid()
  if (elGrid) {
    this.seriesBound = elGrid.getBoundingClientRect()
  }

  let tooltipY = []
  let tooltipX = []

  let seriesHoverParams = {
    hoverArea,
    elGrid,
    tooltipEl,
    tooltipY,
    tooltipX,
    ttItems: this.ttItems,
  }

  let points

  if (w.globals.axisCharts) {
    if (chartWithmarkers) {
      points = w.globals.dom.baseEl.querySelectorAll(
        ".apexcharts-series[data\\:longestSeries='true'] .apexcharts-marker"
      )
    } else if (commonBar) {
      points = w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-series .apexcharts-bar-area, .apexcharts-series .apexcharts-candlestick-area, .apexcharts-series .apexcharts-boxPlot-area, .apexcharts-series .apexcharts-rangebar-area'
      )
    } else if (type === 'heatmap' || type === 'treemap') {
      points = w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-series .apexcharts-heatmap, .apexcharts-series .apexcharts-treemap'
      )
    }

    if (points && points.length) {
      for (let p = 0; p < points.length; p++) {
        tooltipY.push(points[p].getAttribute('cy'))
        tooltipX.push(points[p].getAttribute('cx'))
      }
    }
  }

  const validSharedChartTypes =
    (w.globals.xyCharts && !this.showOnIntersect) ||
    (w.globals.comboCharts && !this.showOnIntersect) ||
    (commonBar && this.tooltipUtil.hasBars() && this.tConfig.shared)

  if (validSharedChartTypes) {
    this.addPathsEventListeners([hoverArea], seriesHoverParams)
  } else if (
    (commonBar && !w.globals.comboCharts) ||
    (chartWithmarkers && this.showOnIntersect)
  ) {
    this.addDatapointEventsListeners(seriesHoverParams)
  } else if (
    !w.globals.axisCharts ||
    type === 'heatmap' ||
    type === 'treemap'
  ) {
    let seriesAll =
      w.globals.dom.baseEl.querySelectorAll('.apexcharts-series')
    this.addPathsEventListeners(seriesAll, seriesHoverParams)
  }

  if (this.showOnIntersect) {
    let lineAreaPoints = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-line-series .apexcharts-marker, .apexcharts-area-series .apexcharts-marker'
    )
    if (lineAreaPoints.length > 0) {
      // if we find any lineSeries, addEventListeners for them
      this.addPathsEventListeners(lineAreaPoints, seriesHoverParams)
    }

    // combo charts may have bars, so add event listeners here too
    if (this.tooltipUtil.hasBars() && !this.tConfig.shared) {
      this.addDatapointEventsListeners(seriesHoverParams)
    }
  }
}
