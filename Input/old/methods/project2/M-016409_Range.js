getMinYMaxY(
  startingIndex,
  lowestY = Number.MAX_VALUE,
  highestY = -Number.MAX_VALUE,
  len = null
) {
  const cnf = this.w.config
  const gl = this.w.globals
  let maxY = -Number.MAX_VALUE
  let minY = Number.MIN_VALUE

  if (len === null) {
    len = startingIndex + 1
  }
  const series = gl.series
  let seriesMin = series
  let seriesMax = series

  if (cnf.chart.type === 'candlestick') {
    seriesMin = gl.seriesCandleL
    seriesMax = gl.seriesCandleH
  } else if (cnf.chart.type === 'boxPlot') {
    seriesMin = gl.seriesCandleO
    seriesMax = gl.seriesCandleC
  } else if (gl.isRangeData) {
    seriesMin = gl.seriesRangeStart
    seriesMax = gl.seriesRangeEnd
  }

  for (let i = startingIndex; i < len; i++) {
    gl.dataPoints = Math.max(gl.dataPoints, series[i].length)

    if (gl.categoryLabels.length) {
      gl.dataPoints = gl.categoryLabels.filter(
        (label) => typeof label !== 'undefined'
      ).length
    }

    if (
      gl.labels.length &&
      cnf.xaxis.type !== 'datetime' &&
      gl.series.reduce((a, c) => a + c.length, 0) !== 0
    ) {
      // the condition cnf.xaxis.type !== 'datetime' fixes #3897 and #3905
      gl.dataPoints = Math.max(gl.dataPoints, gl.labels.length)
    }
    for (let j = 0; j < gl.series[i].length; j++) {
      let val = series[i][j]
      if (val !== null && Utils.isNumber(val)) {
        if (typeof seriesMax[i][j] !== 'undefined') {
          maxY = Math.max(maxY, seriesMax[i][j])
          lowestY = Math.min(lowestY, seriesMax[i][j])
        }
        if (typeof seriesMin[i][j] !== 'undefined') {
          lowestY = Math.min(lowestY, seriesMin[i][j])
          highestY = Math.max(highestY, seriesMin[i][j])
        }

        if (
          this.w.config.chart.type === 'candlestick' ||
          this.w.config.chart.type === 'boxPlot' ||
          this.w.config.chart.type !== 'rangeArea' ||
          this.w.config.chart.type !== 'rangeBar'
        ) {
          if (
            this.w.config.chart.type === 'candlestick' ||
            this.w.config.chart.type === 'boxPlot'
          ) {
            if (typeof gl.seriesCandleC[i][j] !== 'undefined') {
              maxY = Math.max(maxY, gl.seriesCandleO[i][j])
              maxY = Math.max(maxY, gl.seriesCandleH[i][j])
              maxY = Math.max(maxY, gl.seriesCandleL[i][j])
              maxY = Math.max(maxY, gl.seriesCandleC[i][j])
              if (this.w.config.chart.type === 'boxPlot') {
                maxY = Math.max(maxY, gl.seriesCandleM[i][j])
              }
            }
          }

          // there is a combo chart and the specified series in not either candlestick, boxplot, or rangeArea/rangeBar; find the max there
          if (
            cnf.series[i].type &&
            (cnf.series[i].type !== 'candlestick' ||
              cnf.series[i].type !== 'boxPlot' ||
              cnf.series[i].type !== 'rangeArea' ||
              cnf.series[i].type !== 'rangeBar')
          ) {
            maxY = Math.max(maxY, gl.series[i][j])
            lowestY = Math.min(lowestY, gl.series[i][j])
          }

          highestY = maxY
        }

        if (
          gl.seriesGoals[i] &&
          gl.seriesGoals[i][j] &&
          Array.isArray(gl.seriesGoals[i][j])
        ) {
          gl.seriesGoals[i][j].forEach((g) => {
            if (minY !== Number.MIN_VALUE) {
              minY = Math.min(minY, g.value)
              lowestY = minY
            }
            maxY = Math.max(maxY, g.value)
            highestY = maxY
          })
        }

        if (Utils.isFloat(val)) {
          val = Utils.noExponents(val)
          gl.yValueDecimal = Math.max(
            gl.yValueDecimal,
            val.toString().split('.')[1].length
          )
        }
        if (minY > seriesMin[i][j] && seriesMin[i][j] < 0) {
          minY = seriesMin[i][j]
        }
      } else {
        gl.hasNullValues = true
      }
    }
  }

  if (
    cnf.chart.type === 'rangeBar' &&
    gl.seriesRangeStart.length &&
    gl.isBarHorizontal
  ) {
    minY = lowestY
  }

  if (cnf.chart.type === 'bar') {
    if (minY < 0 && maxY < 0) {
      // all negative values in a bar chart, hence make the max to 0
      maxY = 0
    }
    if (minY === Number.MIN_VALUE) {
      minY = 0
    }
  }

  return {
    minY,
    maxY,
    lowestY,
    highestY,
  }
}
