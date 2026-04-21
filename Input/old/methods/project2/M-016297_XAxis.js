additionalPaddingXLabels(xaxisLabelCoords) {
  const w = this.w
  const gl = w.globals
  const cnf = w.config
  const xtype = cnf.xaxis.type

  let lbWidth = xaxisLabelCoords.width

  gl.skipLastTimelinelabel = false
  gl.skipFirstTimelinelabel = false
  const isBarOpposite =
    w.config.yaxis[0].opposite && w.globals.isBarHorizontal

  const isCollapsed = (i) => gl.collapsedSeriesIndices.indexOf(i) !== -1

  const rightPad = (yaxe) => {
    if (this.dCtx.timescaleLabels && this.dCtx.timescaleLabels.length) {
      // for timeline labels, we take the last label and check if it exceeds gridWidth
      const firstimescaleLabel = this.dCtx.timescaleLabels[0]
      const lastTimescaleLabel = this.dCtx.timescaleLabels[
        this.dCtx.timescaleLabels.length - 1
      ]

      const lastLabelPosition =
        lastTimescaleLabel.position +
        lbWidth / 1.75 -
        this.dCtx.yAxisWidthRight

      const firstLabelPosition =
        firstimescaleLabel.position -
        lbWidth / 1.75 +
        this.dCtx.yAxisWidthLeft

      let lgRightRectWidth =
        w.config.legend.position === 'right' && this.dCtx.lgRect.width > 0
          ? this.dCtx.lgRect.width
          : 0
      if (
        lastLabelPosition >
        gl.svgWidth - gl.translateX - lgRightRectWidth
      ) {
        gl.skipLastTimelinelabel = true
      }

      if (
        firstLabelPosition <
        -((!yaxe.show || yaxe.floating) &&
        (cnf.chart.type === 'bar' ||
          cnf.chart.type === 'candlestick' ||
          cnf.chart.type === 'rangeBar' ||
          cnf.chart.type === 'boxPlot')
          ? lbWidth / 1.75
          : 10)
      ) {
        gl.skipFirstTimelinelabel = true
      }
    } else if (xtype === 'datetime') {
      // If user has enabled DateTime, but uses own's formatter
      if (this.dCtx.gridPad.right < lbWidth && !gl.rotateXLabels) {
        gl.skipLastTimelinelabel = true
      }
    } else if (xtype !== 'datetime') {
      if (
        this.dCtx.gridPad.right < lbWidth / 2 - this.dCtx.yAxisWidthRight &&
        !gl.rotateXLabels &&
        !w.config.xaxis.labels.trim &&
        (w.config.xaxis.tickPlacement !== 'between' ||
          w.globals.isBarHorizontal)
      ) {
        this.dCtx.xPadRight = lbWidth / 2 + 1
      }
    }
  }

  const padYAxe = (yaxe, i) => {
    if (cnf.yaxis.length > 1 && isCollapsed(i)) return

    rightPad(yaxe)
  }

  cnf.yaxis.forEach((yaxe, i) => {
    if (isBarOpposite) {
      if (this.dCtx.gridPad.left < lbWidth) {
        this.dCtx.xPadLeft = lbWidth / 2 + 1
      }
      this.dCtx.xPadRight = lbWidth / 2 + 1
    } else {
      padYAxe(yaxe, i)
    }
  })
}
