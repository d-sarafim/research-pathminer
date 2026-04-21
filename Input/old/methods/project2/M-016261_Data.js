handleFormatXY(ser, i) {
  const cnf = this.w.config
  const gl = this.w.globals

  const dt = new DateTime(this.ctx)

  let activeI = i
  if (gl.collapsedSeriesIndices.indexOf(i) > -1) {
    // fix #368
    activeI = this.activeSeriesIndex
  }

  // get series
  for (let j = 0; j < ser[i].data.length; j++) {
    if (typeof ser[i].data[j].y !== 'undefined') {
      if (Array.isArray(ser[i].data[j].y)) {
        this.twoDSeries.push(
          Utils.parseNumber(ser[i].data[j].y[ser[i].data[j].y.length - 1])
        )
      } else {
        this.twoDSeries.push(Utils.parseNumber(ser[i].data[j].y))
      }
    }

    if (
      typeof ser[i].data[j].goals !== 'undefined' &&
      Array.isArray(ser[i].data[j].goals)
    ) {
      if (typeof this.seriesGoals[i] === 'undefined') {
        this.seriesGoals[i] = []
      }
      this.seriesGoals[i].push(ser[i].data[j].goals)
    } else {
      if (typeof this.seriesGoals[i] === 'undefined') {
        this.seriesGoals[i] = []
      }
      this.seriesGoals[i].push(null)
    }
  }

  // get seriesX
  for (let j = 0; j < ser[activeI].data.length; j++) {
    const isXString = typeof ser[activeI].data[j].x === 'string'
    const isXArr = Array.isArray(ser[activeI].data[j].x)
    const isXDate =
      !isXArr && !!dt.isValidDate(ser[activeI].data[j].x.toString())

    if (isXString || isXDate) {
      // user supplied '01/01/2017' or a date string (a JS date object is not supported)
      if (isXString || cnf.xaxis.convertedCatToNumeric) {
        const isRangeColumn = gl.isBarHorizontal && gl.isRangeData

        if (cnf.xaxis.type === 'datetime' && !isRangeColumn) {
          this.twoDSeriesX.push(dt.parseDate(ser[activeI].data[j].x))
        } else {
          // a category and not a numeric x value
          this.fallbackToCategory = true
          this.twoDSeriesX.push(ser[activeI].data[j].x)
        }
      } else {
        if (cnf.xaxis.type === 'datetime') {
          this.twoDSeriesX.push(
            dt.parseDate(ser[activeI].data[j].x.toString())
          )
        } else {
          gl.dataFormatXNumeric = true
          gl.isXNumeric = true
          this.twoDSeriesX.push(parseFloat(ser[activeI].data[j].x))
        }
      }
    } else if (isXArr) {
      // a multiline label described in array format
      this.fallbackToCategory = true
      this.twoDSeriesX.push(ser[activeI].data[j].x)
    } else {
      // a numeric value in x property
      gl.isXNumeric = true
      gl.dataFormatXNumeric = true
      this.twoDSeriesX.push(ser[activeI].data[j].x)
    }
  }

  if (ser[i].data[0] && typeof ser[i].data[0].z !== 'undefined') {
    for (let t = 0; t < ser[i].data.length; t++) {
      this.threeDSeries.push(ser[i].data[t].z)
    }
    gl.isDataXYZ = true
  }
}
