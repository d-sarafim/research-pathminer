drawXaxisInversed(realIndex) {
  let w = this.w
  let graphics = new Graphics(this.ctx)

  let translateYAxisX = w.config.yaxis[0].opposite
    ? w.globals.translateYAxisX[realIndex]
    : 0

  let elYaxis = graphics.group({
    class: 'apexcharts-yaxis apexcharts-xaxis-inversed',
    rel: realIndex,
  })

  let elYaxisTexts = graphics.group({
    class: 'apexcharts-yaxis-texts-g apexcharts-xaxis-inversed-texts-g',
    transform: 'translate(' + translateYAxisX + ', 0)',
  })

  elYaxis.add(elYaxisTexts)

  let colHeight

  // initial x Position (keep adding column width in the loop)
  let yPos
  let labels = []

  if (w.config.yaxis[realIndex].show) {
    for (let i = 0; i < this.xaxisLabels.length; i++) {
      labels.push(this.xaxisLabels[i])
    }
  }

  colHeight = w.globals.gridHeight / labels.length
  yPos = -(colHeight / 2.2)

  let lbFormatter = w.globals.yLabelFormatters[0]

  const ylabels = w.config.yaxis[0].labels

  if (ylabels.show) {
    for (let i = 0; i <= labels.length - 1; i++) {
      let label = typeof labels[i] === 'undefined' ? '' : labels[i]

      label = lbFormatter(label, {
        seriesIndex: realIndex,
        dataPointIndex: i,
        w,
      })

      const yColors = this.axesUtils.getYAxisForeColor(
        ylabels.style.colors,
        realIndex
      )
      const getForeColor = () => {
        return Array.isArray(yColors) ? yColors[i] : yColors
      }

      let multiY = 0
      if (Array.isArray(label)) {
        multiY = (label.length / 2) * parseInt(ylabels.style.fontSize, 10)
      }

      let offsetX = ylabels.offsetX - 15
      let textAnchor = 'end'
      if (this.yaxis.opposite) {
        textAnchor = 'start'
      }
      if (w.config.yaxis[0].labels.align === 'left') {
        offsetX = ylabels.offsetX
        textAnchor = 'start'
      } else if (w.config.yaxis[0].labels.align === 'center') {
        offsetX = ylabels.offsetX
        textAnchor = 'middle'
      } else if (w.config.yaxis[0].labels.align === 'right') {
        textAnchor = 'end'
      }

      let elLabel = graphics.drawText({
        x: offsetX,
        y: yPos + colHeight + ylabels.offsetY - multiY,
        text: label,
        textAnchor,
        foreColor: getForeColor(),
        fontSize: ylabels.style.fontSize,
        fontFamily: ylabels.style.fontFamily,
        fontWeight: ylabels.style.fontWeight,
        isPlainText: false,
        cssClass: 'apexcharts-yaxis-label ' + ylabels.style.cssClass,
        maxWidth: ylabels.maxWidth,
      })

      elYaxisTexts.add(elLabel)

      elLabel.on('click', (e) => {
        if (typeof w.config.chart.events.xAxisLabelClick === 'function') {
          const opts = Object.assign({}, w, {
            labelIndex: i,
          })

          w.config.chart.events.xAxisLabelClick(e, this.ctx, opts)
        }
      })

      let elTooltipTitle = document.createElementNS(w.globals.SVGNS, 'title')
      elTooltipTitle.textContent = Array.isArray(label)
        ? label.join(' ')
        : label
      elLabel.node.appendChild(elTooltipTitle)

      if (w.config.yaxis[realIndex].labels.rotate !== 0) {
        let labelRotatingCenter = graphics.rotateAroundCenter(elLabel.node)
        elLabel.node.setAttribute(
          'transform',
          `rotate(${w.config.yaxis[realIndex].labels.rotate} 0 ${labelRotatingCenter.y})`
        )
      }
      yPos = yPos + colHeight
    }
  }

  if (w.config.yaxis[0].title.text !== undefined) {
    let elXaxisTitle = graphics.group({
      class: 'apexcharts-yaxis-title apexcharts-xaxis-title-inversed',
      transform: 'translate(' + translateYAxisX + ', 0)',
    })

    let elXAxisTitleText = graphics.drawText({
      x: w.config.yaxis[0].title.offsetX,
      y: w.globals.gridHeight / 2 + w.config.yaxis[0].title.offsetY,
      text: w.config.yaxis[0].title.text,
      textAnchor: 'middle',
      foreColor: w.config.yaxis[0].title.style.color,
      fontSize: w.config.yaxis[0].title.style.fontSize,
      fontWeight: w.config.yaxis[0].title.style.fontWeight,
      fontFamily: w.config.yaxis[0].title.style.fontFamily,
      cssClass:
        'apexcharts-yaxis-title-text ' +
        w.config.yaxis[0].title.style.cssClass,
    })

    elXaxisTitle.add(elXAxisTitleText)

    elYaxis.add(elXaxisTitle)
  }

  let offX = 0
  if (this.isCategoryBarHorizontal && w.config.yaxis[0].opposite) {
    offX = w.globals.gridWidth
  }
  const axisBorder = w.config.xaxis.axisBorder
  if (axisBorder.show) {
    let elVerticalLine = graphics.drawLine(
      w.globals.padHorizontal + axisBorder.offsetX + offX,
      1 + axisBorder.offsetY,
      w.globals.padHorizontal + axisBorder.offsetX + offX,
      w.globals.gridHeight + axisBorder.offsetY,
      axisBorder.color,
      0
    )

    if (this.elgrid && this.elgrid.elGridBorders && w.config.grid.show) {
      this.elgrid.elGridBorders.add(elVerticalLine)
    } else {
      elYaxis.add(elVerticalLine)
    }
  }

  if (w.config.yaxis[0].axisTicks.show) {
    this.axesUtils.drawYAxisTicks(
      offX,
      labels.length,
      w.config.yaxis[0].axisBorder,
      w.config.yaxis[0].axisTicks,
      0,
      colHeight,
      elYaxis
    )
  }

  return elYaxis
}
