drawYaxis(realIndex) {
  let w = this.w
  let graphics = new Graphics(this.ctx)

  const yaxisStyle = w.config.yaxis[realIndex].labels.style
  let yaxisFontSize = yaxisStyle.fontSize
  let yaxisFontFamily = yaxisStyle.fontFamily
  let yaxisFontWeight = yaxisStyle.fontWeight

  let elYaxis = graphics.group({
    class: 'apexcharts-yaxis',
    rel: realIndex,
    transform: 'translate(' + w.globals.translateYAxisX[realIndex] + ', 0)'
  })

  if (this.axesUtils.isYAxisHidden(realIndex)) {
    return elYaxis
  }

  let elYaxisTexts = graphics.group({
    class: 'apexcharts-yaxis-texts-g'
  })

  elYaxis.add(elYaxisTexts)

  let tickAmount = w.globals.yAxisScale[realIndex].result.length - 1

  // labelsDivider is simply svg height/number of ticks
  let labelsDivider = w.globals.gridHeight / tickAmount

  // initial label position = 0;
  let l = w.globals.translateY
  let lbFormatter = w.globals.yLabelFormatters[realIndex]

  let labels = w.globals.yAxisScale[realIndex].result.slice()

  labels = this.axesUtils.checkForReversedLabels(realIndex, labels)

  let firstLabel = ''
  if (w.config.yaxis[realIndex].labels.show) {
    for (let i = tickAmount; i >= 0; i--) {
      let val = labels[i]

      val = lbFormatter(val, i, w)

      let xPad = w.config.yaxis[realIndex].labels.padding
      if (w.config.yaxis[realIndex].opposite && w.config.yaxis.length !== 0) {
        xPad = xPad * -1
      }

      let textAnchor = 'end'
      if (w.config.yaxis[realIndex].opposite) {
        textAnchor = 'start'
      }
      if (w.config.yaxis[realIndex].labels.align === 'left') {
        textAnchor = 'start'
      } else if (w.config.yaxis[realIndex].labels.align === 'center') {
        textAnchor = 'middle'
      } else if (w.config.yaxis[realIndex].labels.align === 'right') {
        textAnchor = 'end'
      }

      const yColors = this.axesUtils.getYAxisForeColor(
        yaxisStyle.colors,
        realIndex
      )
      const getForeColor = () => {
        return Array.isArray(yColors) ? yColors[i] : yColors
      }

      let label = graphics.drawText({
        x: xPad,
        y: l + tickAmount / 10 + w.config.yaxis[realIndex].labels.offsetY + 1,
        text: val,
        textAnchor,
        fontSize: yaxisFontSize,
        fontFamily: yaxisFontFamily,
        fontWeight: yaxisFontWeight,
        maxWidth: w.config.yaxis[realIndex].labels.maxWidth,
        foreColor: getForeColor(),
        isPlainText: false,
        cssClass: 'apexcharts-yaxis-label ' + yaxisStyle.cssClass
      })
      if (i === tickAmount) {
        firstLabel = label
      }
      elYaxisTexts.add(label)

      let elTooltipTitle = document.createElementNS(w.globals.SVGNS, 'title')
      elTooltipTitle.textContent = Array.isArray(val) ? val.join(' ') : val
      label.node.appendChild(elTooltipTitle)

      if (w.config.yaxis[realIndex].labels.rotate !== 0) {
        let firstabelRotatingCenter = graphics.rotateAroundCenter(
          firstLabel.node
        )
        let labelRotatingCenter = graphics.rotateAroundCenter(label.node)
        label.node.setAttribute(
          'transform',
          `rotate(${w.config.yaxis[realIndex].labels.rotate} ${firstabelRotatingCenter.x} ${labelRotatingCenter.y})`
        )
      }
      l = l + labelsDivider
    }
  }

  if (w.config.yaxis[realIndex].title.text !== undefined) {
    let elYaxisTitle = graphics.group({
      class: 'apexcharts-yaxis-title'
    })

    let x = 0
    if (w.config.yaxis[realIndex].opposite) {
      x = w.globals.translateYAxisX[realIndex]
    }
    let elYAxisTitleText = graphics.drawText({
      x,
      y:
        w.globals.gridHeight / 2 +
        w.globals.translateY +
        w.config.yaxis[realIndex].title.offsetY,
      text: w.config.yaxis[realIndex].title.text,
      textAnchor: 'end',
      foreColor: w.config.yaxis[realIndex].title.style.color,
      fontSize: w.config.yaxis[realIndex].title.style.fontSize,
      fontWeight: w.config.yaxis[realIndex].title.style.fontWeight,
      fontFamily: w.config.yaxis[realIndex].title.style.fontFamily,
      cssClass:
        'apexcharts-yaxis-title-text ' +
        w.config.yaxis[realIndex].title.style.cssClass
    })

    elYaxisTitle.add(elYAxisTitleText)

    elYaxis.add(elYaxisTitle)
  }

  let axisBorder = w.config.yaxis[realIndex].axisBorder

  let x = 31 + axisBorder.offsetX
  if (w.config.yaxis[realIndex].opposite) {
    x = -31 - axisBorder.offsetX
  }

  if (axisBorder.show) {
    let elVerticalLine = graphics.drawLine(
      x,
      w.globals.translateY + axisBorder.offsetY - 2,
      x,
      w.globals.gridHeight + w.globals.translateY + axisBorder.offsetY + 2,
      axisBorder.color,
      0,
      axisBorder.width
    )

    elYaxis.add(elVerticalLine)
  }
  if (w.config.yaxis[realIndex].axisTicks.show) {
    this.axesUtils.drawYAxisTicks(
      x,
      tickAmount,
      axisBorder,
      w.config.yaxis[realIndex].axisTicks,
      realIndex,
      labelsDivider,
      elYaxis
    )
  }

  return elYaxis
}
