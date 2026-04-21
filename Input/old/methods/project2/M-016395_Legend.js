drawLegends() {
  let me = this
  let w = this.w

  let fontFamily = w.config.legend.fontFamily

  let legendNames = w.globals.seriesNames
  let fillcolor = w.globals.colors.slice()

  if (w.config.chart.type === 'heatmap') {
    const ranges = w.config.plotOptions.heatmap.colorScale.ranges
    legendNames = ranges.map((colorScale) => {
      return colorScale.name
        ? colorScale.name
        : colorScale.from + ' - ' + colorScale.to
    })
    fillcolor = ranges.map((color) => color.color)
  } else if (this.isBarsDistributed) {
    legendNames = w.globals.labels.slice()
  }

  if (w.config.legend.customLegendItems.length) {
    legendNames = w.config.legend.customLegendItems
  }
  let legendFormatter = w.globals.legendFormatter

  let isLegendInversed = w.config.legend.inverseOrder

  for (
    let i = isLegendInversed ? legendNames.length - 1 : 0;
    isLegendInversed ? i >= 0 : i <= legendNames.length - 1;
    isLegendInversed ? i-- : i++
  ) {
    let text = legendFormatter(legendNames[i], { seriesIndex: i, w })

    let collapsedSeries = false
    let ancillaryCollapsedSeries = false
    if (w.globals.collapsedSeries.length > 0) {
      for (let c = 0; c < w.globals.collapsedSeries.length; c++) {
        if (w.globals.collapsedSeries[c].index === i) {
          collapsedSeries = true
        }
      }
    }

    if (w.globals.ancillaryCollapsedSeriesIndices.length > 0) {
      for (
        let c = 0;
        c < w.globals.ancillaryCollapsedSeriesIndices.length;
        c++
      ) {
        if (w.globals.ancillaryCollapsedSeriesIndices[c] === i) {
          ancillaryCollapsedSeries = true
        }
      }
    }

    let elMarker = document.createElement('span')
    elMarker.classList.add('apexcharts-legend-marker')

    let mOffsetX = w.config.legend.markers.offsetX
    let mOffsetY = w.config.legend.markers.offsetY
    let mHeight = w.config.legend.markers.height
    let mWidth = w.config.legend.markers.width
    let mBorderWidth = w.config.legend.markers.strokeWidth
    let mBorderColor = w.config.legend.markers.strokeColor
    let mBorderRadius = w.config.legend.markers.radius

    let mStyle = elMarker.style

    mStyle.background = fillcolor[i]
    mStyle.color = fillcolor[i]
    mStyle.setProperty('background', fillcolor[i], 'important')

    // override fill color with custom legend.markers.fillColors
    if (
      w.config.legend.markers.fillColors &&
      w.config.legend.markers.fillColors[i]
    ) {
      mStyle.background = w.config.legend.markers.fillColors[i]
    }

    // override with data color
    if (w.globals.seriesColors[i] !== undefined) {
      mStyle.background = w.globals.seriesColors[i]
      mStyle.color = w.globals.seriesColors[i]
    }

    mStyle.height = Array.isArray(mHeight)
      ? parseFloat(mHeight[i]) + 'px'
      : parseFloat(mHeight) + 'px'
    mStyle.width = Array.isArray(mWidth)
      ? parseFloat(mWidth[i]) + 'px'
      : parseFloat(mWidth) + 'px'
    mStyle.left =
      (Array.isArray(mOffsetX)
        ? parseFloat(mOffsetX[i])
        : parseFloat(mOffsetX)) + 'px'
    mStyle.top =
      (Array.isArray(mOffsetY)
        ? parseFloat(mOffsetY[i])
        : parseFloat(mOffsetY)) + 'px'
    mStyle.borderWidth = Array.isArray(mBorderWidth)
      ? mBorderWidth[i]
      : mBorderWidth
    mStyle.borderColor = Array.isArray(mBorderColor)
      ? mBorderColor[i]
      : mBorderColor
    mStyle.borderRadius = Array.isArray(mBorderRadius)
      ? parseFloat(mBorderRadius[i]) + 'px'
      : parseFloat(mBorderRadius) + 'px'

    if (w.config.legend.markers.customHTML) {
      if (Array.isArray(w.config.legend.markers.customHTML)) {
        if (w.config.legend.markers.customHTML[i]) {
          elMarker.innerHTML = w.config.legend.markers.customHTML[i]()
        }
      } else {
        elMarker.innerHTML = w.config.legend.markers.customHTML()
      }
    }

    Graphics.setAttrs(elMarker, {
      rel: i + 1,
      'data:collapsed': collapsedSeries || ancillaryCollapsedSeries,
    })

    if (collapsedSeries || ancillaryCollapsedSeries) {
      elMarker.classList.add('apexcharts-inactive-legend')
    }

    let elLegend = document.createElement('div')

    let elLegendText = document.createElement('span')
    elLegendText.classList.add('apexcharts-legend-text')
    elLegendText.innerHTML = Array.isArray(text) ? text.join(' ') : text

    let textColor = w.config.legend.labels.useSeriesColors
      ? w.globals.colors[i]
      : Array.isArray(w.config.legend.labels.colors)
      ? w.config.legend.labels.colors?.[i]
      : w.config.legend.labels.colors

    if (!textColor) {
      textColor = w.config.chart.foreColor
    }

    elLegendText.style.color = textColor

    elLegendText.style.fontSize = parseFloat(w.config.legend.fontSize) + 'px'
    elLegendText.style.fontWeight = w.config.legend.fontWeight
    elLegendText.style.fontFamily = fontFamily || w.config.chart.fontFamily

    Graphics.setAttrs(elLegendText, {
      rel: i + 1,
      i,
      'data:default-text': encodeURIComponent(text),
      'data:collapsed': collapsedSeries || ancillaryCollapsedSeries,
    })

    elLegend.appendChild(elMarker)
    elLegend.appendChild(elLegendText)

    const coreUtils = new CoreUtils(this.ctx)
    if (!w.config.legend.showForZeroSeries) {
      const total = coreUtils.getSeriesTotalByIndex(i)

      if (
        total === 0 &&
        coreUtils.seriesHaveSameValues(i) &&
        !coreUtils.isSeriesNull(i) &&
        w.globals.collapsedSeriesIndices.indexOf(i) === -1 &&
        w.globals.ancillaryCollapsedSeriesIndices.indexOf(i) === -1
      ) {
        elLegend.classList.add('apexcharts-hidden-zero-series')
      }
    }

    if (!w.config.legend.showForNullSeries) {
      if (
        coreUtils.isSeriesNull(i) &&
        w.globals.collapsedSeriesIndices.indexOf(i) === -1 &&
        w.globals.ancillaryCollapsedSeriesIndices.indexOf(i) === -1
      ) {
        elLegend.classList.add('apexcharts-hidden-null-series')
      }
    }

    w.globals.dom.elLegendWrap.appendChild(elLegend)
    w.globals.dom.elLegendWrap.classList.add(
      `apexcharts-align-${w.config.legend.horizontalAlign}`
    )
    w.globals.dom.elLegendWrap.classList.add(
      'apx-legend-position-' + w.config.legend.position
    )

    elLegend.classList.add('apexcharts-legend-series')
    elLegend.style.margin = `${w.config.legend.itemMargin.vertical}px ${w.config.legend.itemMargin.horizontal}px`
    w.globals.dom.elLegendWrap.style.width = w.config.legend.width
      ? w.config.legend.width + 'px'
      : ''
    w.globals.dom.elLegendWrap.style.height = w.config.legend.height
      ? w.config.legend.height + 'px'
      : ''

    Graphics.setAttrs(elLegend, {
      rel: i + 1,
      seriesName: Utils.escapeString(legendNames[i]),
      'data:collapsed': collapsedSeries || ancillaryCollapsedSeries,
    })

    if (collapsedSeries || ancillaryCollapsedSeries) {
      elLegend.classList.add('apexcharts-inactive-legend')
    }

    if (!w.config.legend.onItemClick.toggleDataSeries) {
      elLegend.classList.add('apexcharts-no-click')
    }
  }

  w.globals.dom.elWrap.addEventListener('click', me.onLegendClick, true)

  if (
    w.config.legend.onItemHover.highlightDataSeries &&
    w.config.legend.customLegendItems.length === 0
  ) {
    w.globals.dom.elWrap.addEventListener(
      'mousemove',
      me.onLegendHovered,
      true
    )
    w.globals.dom.elWrap.addEventListener(
      'mouseout',
      me.onLegendHovered,
      true
    )
  }
}
