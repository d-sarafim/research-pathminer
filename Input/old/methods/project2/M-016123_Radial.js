drawArcs(opts) {
  let w = this.w
  // size, donutSize, centerX, centerY, colorArr, lineColorArr, sectorAngleArr, series

  let graphics = new Graphics(this.ctx)
  let fill = new Fill(this.ctx)
  let filters = new Filters(this.ctx)
  let g = graphics.group()

  let strokeWidth = this.getStrokeWidth(opts)
  opts.size = opts.size - strokeWidth / 2

  let hollowFillID = w.config.plotOptions.radialBar.hollow.background
  let hollowSize =
    opts.size -
    strokeWidth * opts.series.length -
    this.margin * opts.series.length -
    (strokeWidth *
      parseInt(w.config.plotOptions.radialBar.track.strokeWidth, 10)) /
      100 /
      2

  let hollowRadius = hollowSize - w.config.plotOptions.radialBar.hollow.margin

  if (w.config.plotOptions.radialBar.hollow.image !== undefined) {
    hollowFillID = this.drawHollowImage(opts, g, hollowSize, hollowFillID)
  }

  let elHollow = this.drawHollow({
    size: hollowRadius,
    centerX: opts.centerX,
    centerY: opts.centerY,
    fill: hollowFillID ? hollowFillID : 'transparent'
  })

  if (w.config.plotOptions.radialBar.hollow.dropShadow.enabled) {
    const shadow = w.config.plotOptions.radialBar.hollow.dropShadow
    filters.dropShadow(elHollow, shadow)
  }

  let shown = 1
  if (!this.radialDataLabels.total.show && w.globals.series.length > 1) {
    shown = 0
  }

  let dataLabels = null

  if (this.radialDataLabels.show) {
    dataLabels = this.renderInnerDataLabels(this.radialDataLabels, {
      hollowSize,
      centerX: opts.centerX,
      centerY: opts.centerY,
      opacity: shown
    })
  }

  if (w.config.plotOptions.radialBar.hollow.position === 'back') {
    g.add(elHollow)
    if (dataLabels) {
      g.add(dataLabels)
    }
  }

  let reverseLoop = false
  if (w.config.plotOptions.radialBar.inverseOrder) {
    reverseLoop = true
  }

  for (
    let i = reverseLoop ? opts.series.length - 1 : 0;
    reverseLoop ? i >= 0 : i < opts.series.length;
    reverseLoop ? i-- : i++
  ) {
    let elRadialBarArc = graphics.group({
      class: `apexcharts-series apexcharts-radial-series`,
      seriesName: Utils.escapeString(w.globals.seriesNames[i])
    })
    g.add(elRadialBarArc)

    elRadialBarArc.attr({
      rel: i + 1,
      'data:realIndex': i
    })

    this.ctx.series.addCollapsedClassToSeries(elRadialBarArc, i)

    opts.size = opts.size - strokeWidth - this.margin

    let pathFill = fill.fillPath({
      seriesNumber: i,
      size: opts.size,
      value: opts.series[i]
    })

    let startAngle = this.startAngle
    let prevStartAngle

    // if data exceeds 100, make it 100
    const dataValue =
      Utils.negToZero(opts.series[i] > 100 ? 100 : opts.series[i]) / 100

    let endAngle = Math.round(this.totalAngle * dataValue) + this.startAngle

    let prevEndAngle
    if (w.globals.dataChanged) {
      prevStartAngle = this.startAngle
      prevEndAngle =
        Math.round(
          (this.totalAngle * Utils.negToZero(w.globals.previousPaths[i])) /
            100
        ) + prevStartAngle
    }

    const currFullAngle = Math.abs(endAngle) + Math.abs(startAngle)
    if (currFullAngle >= 360) {
      endAngle = endAngle - 0.01
    }

    const prevFullAngle = Math.abs(prevEndAngle) + Math.abs(prevStartAngle)
    if (prevFullAngle >= 360) {
      prevEndAngle = prevEndAngle - 0.01
    }

    let angle = endAngle - startAngle

    const dashArray = Array.isArray(w.config.stroke.dashArray)
      ? w.config.stroke.dashArray[i]
      : w.config.stroke.dashArray

    let elPath = graphics.drawPath({
      d: '',
      stroke: pathFill,
      strokeWidth,
      fill: 'none',
      fillOpacity: w.config.fill.opacity,
      classes: 'apexcharts-radialbar-area apexcharts-radialbar-slice-' + i,
      strokeDashArray: dashArray
    })

    Graphics.setAttrs(elPath.node, {
      'data:angle': angle,
      'data:value': opts.series[i]
    })

    if (w.config.chart.dropShadow.enabled) {
      const shadow = w.config.chart.dropShadow
      filters.dropShadow(elPath, shadow, i)
    }
    filters.setSelectionFilter(elPath, 0, i)

    this.addListeners(elPath, this.radialDataLabels)

    elRadialBarArc.add(elPath)

    elPath.attr({
      index: 0,
      j: i
    })

    let dur = 0
    if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
      dur = w.config.chart.animations.speed
    }

    if (w.globals.dataChanged) {
      dur = w.config.chart.animations.dynamicAnimation.speed
    }
    this.animDur = dur / (opts.series.length * 1.2) + this.animDur
    this.animBeginArr.push(this.animDur)

    this.animatePaths(elPath, {
      centerX: opts.centerX,
      centerY: opts.centerY,
      endAngle,
      startAngle,
      prevEndAngle,
      prevStartAngle,
      size: opts.size,
      i,
      totalItems: 2,
      animBeginArr: this.animBeginArr,
      dur,
      shouldSetPrevPaths: true,
      easing: w.globals.easing
    })
  }

  return {
    g,
    elHollow,
    dataLabels
  }
}
