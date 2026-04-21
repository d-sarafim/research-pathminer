setXRange() {
  let gl = this.w.globals
  let cnf = this.w.config

  const isXNumeric =
    cnf.xaxis.type === 'numeric' ||
    cnf.xaxis.type === 'datetime' ||
    (cnf.xaxis.type === 'category' && !gl.noLabelsProvided) ||
    gl.noLabelsProvided ||
    gl.isXNumeric

  const getInitialMinXMaxX = () => {
    for (let i = 0; i < gl.series.length; i++) {
      if (gl.labels[i]) {
        for (let j = 0; j < gl.labels[i].length; j++) {
          if (gl.labels[i][j] !== null && Utils.isNumber(gl.labels[i][j])) {
            gl.maxX = Math.max(gl.maxX, gl.labels[i][j])
            gl.initialMaxX = Math.max(gl.maxX, gl.labels[i][j])
            gl.minX = Math.min(gl.minX, gl.labels[i][j])
            gl.initialMinX = Math.min(gl.minX, gl.labels[i][j])
          }
        }
      }
    }
  }
  // minX maxX starts here
  if (gl.isXNumeric) {
    getInitialMinXMaxX()
  }

  if (gl.noLabelsProvided) {
    if (cnf.xaxis.categories.length === 0) {
      gl.maxX = gl.labels[gl.labels.length - 1]
      gl.initialMaxX = gl.labels[gl.labels.length - 1]
      gl.minX = 1
      gl.initialMinX = 1
    }
  }

  if (gl.isXNumeric || gl.noLabelsProvided || gl.dataFormatXNumeric) {
    let ticks

    if (cnf.xaxis.tickAmount === undefined) {
      ticks = Math.round(gl.svgWidth / 150)

      // no labels provided and total number of dataPoints is less than 30
      if (cnf.xaxis.type === 'numeric' && gl.dataPoints < 30) {
        ticks = gl.dataPoints - 1
      }

      // this check is for when ticks exceeds total datapoints and that would result in duplicate labels
      if (ticks > gl.dataPoints && gl.dataPoints !== 0) {
        ticks = gl.dataPoints - 1
      }
    } else if (cnf.xaxis.tickAmount === 'dataPoints') {
      if (gl.series.length > 1) {
        ticks = gl.series[gl.maxValsInArrayIndex].length - 1
      }
      if (gl.isXNumeric) {
        ticks = gl.maxX - gl.minX - 1
      }
    } else {
      ticks = cnf.xaxis.tickAmount
    }
    gl.xTickAmount = ticks

    // override all min/max values by user defined values (x axis)
    if (cnf.xaxis.max !== undefined && typeof cnf.xaxis.max === 'number') {
      gl.maxX = cnf.xaxis.max
    }
    if (cnf.xaxis.min !== undefined && typeof cnf.xaxis.min === 'number') {
      gl.minX = cnf.xaxis.min
    }

    // if range is provided, adjust the new minX
    if (cnf.xaxis.range !== undefined) {
      gl.minX = gl.maxX - cnf.xaxis.range
    }

    if (gl.minX !== Number.MAX_VALUE && gl.maxX !== -Number.MAX_VALUE) {
      if (cnf.xaxis.convertedCatToNumeric && !gl.dataFormatXNumeric) {
        let catScale = []
        for (let i = gl.minX - 1; i < gl.maxX; i++) {
          catScale.push(i + 1)
        }
        gl.xAxisScale = {
          result: catScale,
          niceMin: catScale[0],
          niceMax: catScale[catScale.length - 1],
        }
      } else {
        gl.xAxisScale = this.scales.setXScale(gl.minX, gl.maxX)
      }
    } else {
      gl.xAxisScale = this.scales.linearScale(1, ticks, ticks)
      if (gl.noLabelsProvided && gl.labels.length > 0) {
        gl.xAxisScale = this.scales.linearScale(
          1,
          gl.labels.length,
          ticks - 1
        )

        // this is the only place seriesX is again mutated
        gl.seriesX = gl.labels.slice()
      }
    }
    // we will still store these labels as the count for this will be different (to draw grid and labels placement)
    if (isXNumeric) {
      gl.labels = gl.xAxisScale.result.slice()
    }
  }

  if (gl.isBarHorizontal && gl.labels.length) {
    gl.xTickAmount = gl.labels.length
  }

  // single dataPoint
  this._handleSingleDataPoint()

  // minimum x difference to calculate bar width in numeric bars
  this._getMinXDiff()

  return {
    minX: gl.minX,
    maxX: gl.maxX,
  }
}
