create(e, context, capturedSeries, j, ttItems, shared = null) {
  let w = this.w
  let ttCtx = context

  if (e.type === 'mouseup') {
    this.markerClick(e, capturedSeries, j)
  }

  if (shared === null) shared = this.tConfig.shared

  const hasMarkers = this.tooltipUtil.hasMarkers(capturedSeries)

  const bars = this.tooltipUtil.getElBars()

  if (w.config.legend.tooltipHoverFormatter) {
    let legendFormatter = w.config.legend.tooltipHoverFormatter

    let els = Array.from(this.legendLabels)

    // reset all legend values first
    els.forEach((l) => {
      const legendName = l.getAttribute('data:default-text')
      l.innerHTML = decodeURIComponent(legendName)
    })

    // for irregular time series
    for (let i = 0; i < els.length; i++) {
      const l = els[i]
      const lsIndex = parseInt(l.getAttribute('i'), 10)
      const legendName = decodeURIComponent(
        l.getAttribute('data:default-text')
      )

      let text = legendFormatter(legendName, {
        seriesIndex: shared ? lsIndex : capturedSeries,
        dataPointIndex: j,
        w,
      })

      if (!shared) {
        l.innerHTML = lsIndex === capturedSeries ? text : legendName
        if (capturedSeries === lsIndex) {
          break
        }
      } else {
        l.innerHTML =
          w.globals.collapsedSeriesIndices.indexOf(lsIndex) < 0
            ? text
            : legendName
      }
    }
  }

  const commonSeriesTextsParams = {
    ttItems,
    i: capturedSeries,
    j,
    ...(typeof w.globals.seriesRange?.[capturedSeries]?.[j]?.y[0]?.y1 !==
      'undefined' && {
      y1: w.globals.seriesRange?.[capturedSeries]?.[j]?.y[0]?.y1,
    }),
    ...(typeof w.globals.seriesRange?.[capturedSeries]?.[j]?.y[0]?.y2 !==
      'undefined' && {
      y2: w.globals.seriesRange?.[capturedSeries]?.[j]?.y[0]?.y2,
    }),
  }
  if (shared) {
    ttCtx.tooltipLabels.drawSeriesTexts({
      ...commonSeriesTextsParams,
      shared: this.showOnIntersect ? false : this.tConfig.shared,
    })

    if (hasMarkers) {
      if (w.globals.markers.largestSize > 0) {
        ttCtx.marker.enlargePoints(j)
      } else {
        ttCtx.tooltipPosition.moveDynamicPointsOnHover(j)
      }
    } else if (this.tooltipUtil.hasBars()) {
      this.barSeriesHeight = this.tooltipUtil.getBarsHeight(bars)
      if (this.barSeriesHeight > 0) {
        // hover state, activate snap filter
        let graphics = new Graphics(this.ctx)
        let paths = w.globals.dom.Paper.select(
          `.apexcharts-bar-area[j='${j}']`
        )

        // de-activate first
        this.deactivateHoverFilter()

        this.tooltipPosition.moveStickyTooltipOverBars(j, capturedSeries)

        for (let b = 0; b < paths.length; b++) {
          graphics.pathMouseEnter(paths[b])
        }
      }
    }
  } else {
    ttCtx.tooltipLabels.drawSeriesTexts({
      shared: false,
      ...commonSeriesTextsParams,
    })

    if (this.tooltipUtil.hasBars()) {
      ttCtx.tooltipPosition.moveStickyTooltipOverBars(j, capturedSeries)
    }

    if (hasMarkers) {
      ttCtx.tooltipPosition.moveMarkers(capturedSeries, j)
    }
  }
}
