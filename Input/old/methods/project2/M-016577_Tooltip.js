drawTooltip(xyRatios) {
  let w = this.w
  this.xyRatios = xyRatios
  this.isXAxisTooltipEnabled =
    w.config.xaxis.tooltip.enabled && w.globals.axisCharts
  this.yaxisTooltips = w.config.yaxis.map((y, i) => {
    return y.show && y.tooltip.enabled && w.globals.axisCharts ? true : false
  })
  this.allTooltipSeriesGroups = []

  if (!w.globals.axisCharts) {
    this.showTooltipTitle = false
  }

  const tooltipEl = document.createElement('div')
  tooltipEl.classList.add('apexcharts-tooltip')
  if (w.config.tooltip.cssClass) {
    tooltipEl.classList.add(w.config.tooltip.cssClass)
  }
  tooltipEl.classList.add(`apexcharts-theme-${this.tConfig.theme}`)
  w.globals.dom.elWrap.appendChild(tooltipEl)

  if (w.globals.axisCharts) {
    this.axesTooltip.drawXaxisTooltip()
    this.axesTooltip.drawYaxisTooltip()
    this.axesTooltip.setXCrosshairWidth()
    this.axesTooltip.handleYCrosshair()

    let xAxis = new XAxis(this.ctx)
    this.xAxisTicksPositions = xAxis.getXAxisTicksPositions()
  }

  // we forcefully set intersect true for these conditions
  if (
    (w.globals.comboCharts ||
      this.tConfig.intersect ||
      w.config.chart.type === 'rangeBar') &&
    !this.tConfig.shared
  ) {
    this.showOnIntersect = true
  }

  if (w.config.markers.size === 0 || w.globals.markers.largestSize === 0) {
    // when user don't want to show points all the time, but only on when hovering on series
    this.marker.drawDynamicPoints(this)
  }

  // no visible series, exit
  if (w.globals.collapsedSeries.length === w.globals.series.length) return

  this.dataPointsDividedHeight = w.globals.gridHeight / w.globals.dataPoints
  this.dataPointsDividedWidth = w.globals.gridWidth / w.globals.dataPoints

  if (this.showTooltipTitle) {
    this.tooltipTitle = document.createElement('div')
    this.tooltipTitle.classList.add('apexcharts-tooltip-title')
    this.tooltipTitle.style.fontFamily =
      this.tConfig.style.fontFamily || w.config.chart.fontFamily
    this.tooltipTitle.style.fontSize = this.tConfig.style.fontSize
    tooltipEl.appendChild(this.tooltipTitle)
  }

  let ttItemsCnt = w.globals.series.length // whether shared or not, default is shared
  if ((w.globals.xyCharts || w.globals.comboCharts) && this.tConfig.shared) {
    if (!this.showOnIntersect) {
      ttItemsCnt = w.globals.series.length
    } else {
      ttItemsCnt = 1
    }
  }

  this.legendLabels = w.globals.dom.baseEl.querySelectorAll(
    '.apexcharts-legend-text'
  )

  this.ttItems = this.createTTElements(ttItemsCnt)
  this.addSVGEvents()
}
