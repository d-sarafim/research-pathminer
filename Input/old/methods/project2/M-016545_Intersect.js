handleBarTooltip({ e, opt }) {
  const w = this.w
  const ttCtx = this.ttCtx

  const tooltipEl = ttCtx.getElTooltip()

  let bx = 0
  let x = 0
  let y = 0
  let i = 0
  let strokeWidth
  let barXY = this.getBarTooltipXY({
    e,
    opt,
  })
  i = barXY.i
  let barHeight = barXY.barHeight
  let j = barXY.j

  w.globals.capturedSeriesIndex = i
  w.globals.capturedDataPointIndex = j

  if (
    (w.globals.isBarHorizontal && ttCtx.tooltipUtil.hasBars()) ||
    !w.config.tooltip.shared
  ) {
    x = barXY.x
    y = barXY.y
    strokeWidth = Array.isArray(w.config.stroke.width)
      ? w.config.stroke.width[i]
      : w.config.stroke.width
    bx = x
  } else {
    if (!w.globals.comboCharts && !w.config.tooltip.shared) {
      // todo: re-check this condition as it's always 0
      bx = bx / 2
    }
  }

  // y is NaN, make it touch the bottom of grid area
  if (isNaN(y)) {
    y = w.globals.svgHeight - ttCtx.tooltipRect.ttHeight
  }

  const seriesIndex = parseInt(
    opt.paths.parentNode.getAttribute('data:realIndex'),
    10
  )

  const isReversed = w.globals.isMultipleYAxis
    ? w.config.yaxis[seriesIndex] && w.config.yaxis[seriesIndex].reversed
    : w.config.yaxis[0].reversed

  if (x + ttCtx.tooltipRect.ttWidth > w.globals.gridWidth && !isReversed) {
    x = x - ttCtx.tooltipRect.ttWidth
  } else if (x < 0) {
    x = 0
  }

  if (ttCtx.w.config.tooltip.followCursor) {
    const elGrid = ttCtx.getElGrid()
    const seriesBound = elGrid.getBoundingClientRect()
    y = ttCtx.e.clientY - seriesBound.top
  }

  // if tooltip is still null, querySelector
  if (ttCtx.tooltip === null) {
    ttCtx.tooltip = w.globals.dom.baseEl.querySelector('.apexcharts-tooltip')
  }

  if (!w.config.tooltip.shared) {
    if (w.globals.comboBarCount > 0) {
      ttCtx.tooltipPosition.moveXCrosshairs(bx + strokeWidth / 2)
    } else {
      ttCtx.tooltipPosition.moveXCrosshairs(bx)
    }
  }

  // move tooltip here
  if (
    !ttCtx.fixedTooltip &&
    (!w.config.tooltip.shared ||
      (w.globals.isBarHorizontal && ttCtx.tooltipUtil.hasBars()))
  ) {
    if (isReversed) {
      x = x - ttCtx.tooltipRect.ttWidth
      if (x < 0) {
        x = 0
      }
    }
    if (
      isReversed &&
      !(w.globals.isBarHorizontal && ttCtx.tooltipUtil.hasBars())
    ) {
      y = y + barHeight - (w.globals.series[i][j] < 0 ? barHeight : 0) * 2
    }

    y = y + w.globals.translateY - ttCtx.tooltipRect.ttHeight / 2

    tooltipEl.style.left = x + w.globals.translateX + 'px'
    tooltipEl.style.top = y + 'px'
  }
}
