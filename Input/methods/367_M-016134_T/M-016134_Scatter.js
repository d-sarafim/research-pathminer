drawPoint(x, y, radius, finishRadius, realIndex, dataPointIndex, j) {
  const w = this.w

  let i = realIndex
  let anim = new Animations(this.ctx)
  let filters = new Filters(this.ctx)
  let fill = new Fill(this.ctx)
  let markers = new Markers(this.ctx)
  const graphics = new Graphics(this.ctx)

  const markerConfig = markers.getMarkerConfig({
    cssClass: 'apexcharts-marker',
    seriesIndex: i,
    dataPointIndex,
    finishRadius:
      w.config.chart.type === 'bubble' ||
      (w.globals.comboCharts &&
        w.config.series[realIndex] &&
        w.config.series[realIndex].type === 'bubble')
        ? finishRadius
        : null
  })

  finishRadius = markerConfig.pSize

  let pathFillCircle = fill.fillPath({
    seriesNumber: realIndex,
    dataPointIndex,
    color: markerConfig.pointFillColor,
    patternUnits: 'objectBoundingBox',
    value: w.globals.series[realIndex][j]
  })

  let el
  if (markerConfig.shape === 'circle') {
    el = graphics.drawCircle(radius)
  } else if (
    markerConfig.shape === 'square' ||
    markerConfig.shape === 'rect'
  ) {
    el = graphics.drawRect(
      0,
      0,
      markerConfig.width - markerConfig.pointStrokeWidth / 2,
      markerConfig.height - markerConfig.pointStrokeWidth / 2,
      markerConfig.pRadius
    )
  }

  if (w.config.series[i].data[dataPointIndex]) {
    if (w.config.series[i].data[dataPointIndex].fillColor) {
      pathFillCircle = w.config.series[i].data[dataPointIndex].fillColor
    }
  }

  el.attr({
    x: x - markerConfig.width / 2 - markerConfig.pointStrokeWidth / 2,
    y: y - markerConfig.height / 2 - markerConfig.pointStrokeWidth / 2,
    cx: x,
    cy: y,
    fill: pathFillCircle,
    'fill-opacity': markerConfig.pointFillOpacity,
    stroke: markerConfig.pointStrokeColor,
    r: finishRadius,
    'stroke-width': markerConfig.pointStrokeWidth,
    'stroke-dasharray': markerConfig.pointStrokeDashArray,
    'stroke-opacity': markerConfig.pointStrokeOpacity
  })

  if (w.config.chart.dropShadow.enabled) {
    const dropShadow = w.config.chart.dropShadow
    filters.dropShadow(el, dropShadow, realIndex)
  }

  if (this.initialAnim && !w.globals.dataChanged && !w.globals.resized) {
    let speed = w.config.chart.animations.speed

    anim.animateMarker(
      el,
      0,
      markerConfig.shape === 'circle'
        ? finishRadius
        : { width: markerConfig.width, height: markerConfig.height },
      speed,
      w.globals.easing,
      () => {
        window.setTimeout(() => {
          anim.animationCompleted(el)
        }, 100)
      }
    )
  } else {
    w.globals.animationEnded = true
  }

  if (w.globals.dataChanged && markerConfig.shape === 'circle') {
    if (this.dynamicAnim) {
      let speed = w.config.chart.animations.dynamicAnimation.speed
      let prevX, prevY, prevR

      let prevPathJ = null

      prevPathJ =
        w.globals.previousPaths[realIndex] &&
        w.globals.previousPaths[realIndex][j]

      if (typeof prevPathJ !== 'undefined' && prevPathJ !== null) {
        // series containing less elements will ignore these values and revert to 0
        prevX = prevPathJ.x
        prevY = prevPathJ.y
        prevR =
          typeof prevPathJ.r !== 'undefined' ? prevPathJ.r : finishRadius
      }

      for (let cs = 0; cs < w.globals.collapsedSeries.length; cs++) {
        if (w.globals.collapsedSeries[cs].index === realIndex) {
          speed = 1
          finishRadius = 0
        }
      }

      if (x === 0 && y === 0) finishRadius = 0

      anim.animateCircle(
        el,
        {
          cx: prevX,
          cy: prevY,
          r: prevR
        },
        {
          cx: x,
          cy: y,
          r: finishRadius
        },
        speed,
        w.globals.easing
      )
    } else {
      el.attr({
        r: finishRadius
      })
    }
  }

  el.attr({
    rel: dataPointIndex,
    j: dataPointIndex,
    index: realIndex,
    'default-marker-size': finishRadius
  })

  filters.setSelectionFilter(el, realIndex, dataPointIndex)
  markers.addEvents(el)

  el.node.classList.add('apexcharts-marker')

  return el
}
