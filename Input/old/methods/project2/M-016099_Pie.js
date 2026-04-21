drawArcs(sectorAngleArr, series) {
  let w = this.w
  const filters = new Filters(this.ctx)

  let graphics = new Graphics(this.ctx)
  let fill = new Fill(this.ctx)
  let g = graphics.group({
    class: 'apexcharts-slices',
  })

  let startAngle = this.initialAngle
  let prevStartAngle = this.initialAngle
  let endAngle = this.initialAngle
  let prevEndAngle = this.initialAngle

  this.strokeWidth = w.config.stroke.show ? w.config.stroke.width : 0

  for (let i = 0; i < sectorAngleArr.length; i++) {
    let elPieArc = graphics.group({
      class: `apexcharts-series apexcharts-pie-series`,
      seriesName: Utils.escapeString(w.globals.seriesNames[i]),
      rel: i + 1,
      'data:realIndex': i,
    })

    g.add(elPieArc)

    startAngle = endAngle
    prevStartAngle = prevEndAngle

    endAngle = startAngle + sectorAngleArr[i]
    prevEndAngle = prevStartAngle + this.prevSectorAngleArr[i]

    const angle =
      endAngle < startAngle
        ? this.fullAngle + endAngle - startAngle
        : endAngle - startAngle

    let pathFill = fill.fillPath({
      seriesNumber: i,
      size: this.sliceSizes[i],
      value: series[i],
    }) // additionally, pass size for gradient drawing in the fillPath function

    let path = this.getChangedPath(prevStartAngle, prevEndAngle)

    let elPath = graphics.drawPath({
      d: path,
      stroke: Array.isArray(this.lineColorArr)
        ? this.lineColorArr[i]
        : this.lineColorArr,
      strokeWidth: 0,
      fill: pathFill,
      fillOpacity: w.config.fill.opacity,
      classes: `apexcharts-pie-area apexcharts-${this.chartType.toLowerCase()}-slice-${i}`,
    })

    elPath.attr({
      index: 0,
      j: i,
    })

    filters.setSelectionFilter(elPath, 0, i)

    if (w.config.chart.dropShadow.enabled) {
      const shadow = w.config.chart.dropShadow
      filters.dropShadow(elPath, shadow, i)
    }

    this.addListeners(elPath, this.donutDataLabels)

    Graphics.setAttrs(elPath.node, {
      'data:angle': angle,
      'data:startAngle': startAngle,
      'data:strokeWidth': this.strokeWidth,
      'data:value': series[i],
    })

    let labelPosition = {
      x: 0,
      y: 0,
    }

    if (this.chartType === 'pie' || this.chartType === 'polarArea') {
      labelPosition = Utils.polarToCartesian(
        this.centerX,
        this.centerY,
        w.globals.radialSize / 1.25 +
          w.config.plotOptions.pie.dataLabels.offset,
        (startAngle + angle / 2) % this.fullAngle
      )
    } else if (this.chartType === 'donut') {
      labelPosition = Utils.polarToCartesian(
        this.centerX,
        this.centerY,
        (w.globals.radialSize + this.donutSize) / 2 +
          w.config.plotOptions.pie.dataLabels.offset,
        (startAngle + angle / 2) % this.fullAngle
      )
    }

    elPieArc.add(elPath)

    // Animation code starts
    let dur = 0
    if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
      dur = (angle / this.fullAngle) * w.config.chart.animations.speed

      if (dur === 0) dur = 1
      this.animDur = dur + this.animDur
      this.animBeginArr.push(this.animDur)
    } else {
      this.animBeginArr.push(0)
    }

    if (this.dynamicAnim && w.globals.dataChanged) {
      this.animatePaths(elPath, {
        size: this.sliceSizes[i],
        endAngle,
        startAngle,
        prevStartAngle,
        prevEndAngle,
        animateStartingPos: true,
        i,
        animBeginArr: this.animBeginArr,
        shouldSetPrevPaths: true,
        dur: w.config.chart.animations.dynamicAnimation.speed,
      })
    } else {
      this.animatePaths(elPath, {
        size: this.sliceSizes[i],
        endAngle,
        startAngle,
        i,
        totalItems: sectorAngleArr.length - 1,
        animBeginArr: this.animBeginArr,
        dur,
      })
    }
    // animation code ends

    if (
      w.config.plotOptions.pie.expandOnClick &&
      this.chartType !== 'polarArea'
    ) {
      elPath.click(this.pieClicked.bind(this, i))
    }

    if (
      typeof w.globals.selectedDataPoints[0] !== 'undefined' &&
      w.globals.selectedDataPoints[0].indexOf(i) > -1
    ) {
      this.pieClicked(i)
    }

    if (w.config.dataLabels.enabled) {
      let xPos = labelPosition.x
      let yPos = labelPosition.y
      let text = (100 * angle) / this.fullAngle + '%'

      if (
        angle !== 0 &&
        w.config.plotOptions.pie.dataLabels.minAngleToShowLabel <
          sectorAngleArr[i]
      ) {
        let formatter = w.config.dataLabels.formatter
        if (formatter !== undefined) {
          text = formatter(w.globals.seriesPercent[i][0], {
            seriesIndex: i,
            w,
          })
        }
        let foreColor = w.globals.dataLabels.style.colors[i]

        const elPieLabelWrap = graphics.group({
          class: `apexcharts-datalabels`,
        })
        let elPieLabel = graphics.drawText({
          x: xPos,
          y: yPos,
          text,
          textAnchor: 'middle',
          fontSize: w.config.dataLabels.style.fontSize,
          fontFamily: w.config.dataLabels.style.fontFamily,
          fontWeight: w.config.dataLabels.style.fontWeight,
          foreColor,
        })

        elPieLabelWrap.add(elPieLabel)
        if (w.config.dataLabels.dropShadow.enabled) {
          const textShadow = w.config.dataLabels.dropShadow
          filters.dropShadow(elPieLabel, textShadow)
        }

        elPieLabel.node.classList.add('apexcharts-pie-label')
        if (
          w.config.chart.animations.animate &&
          w.globals.resized === false
        ) {
          elPieLabel.node.classList.add('apexcharts-pie-label-delay')
          elPieLabel.node.style.animationDelay =
            w.config.chart.animations.speed / 940 + 's'
        }

        this.sliceLabels.push(elPieLabelWrap)
      }
    }
  }

  return g
}
