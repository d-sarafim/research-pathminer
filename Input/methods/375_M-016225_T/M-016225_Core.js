plotChartType(ser, xyRatios) {
  const w = this.w
  const cnf = w.config
  const gl = w.globals

  let lineSeries = {
    series: [],
    i: [],
  }
  let areaSeries = {
    series: [],
    i: [],
  }
  let scatterSeries = {
    series: [],
    i: [],
  }

  let bubbleSeries = {
    series: [],
    i: [],
  }

  let columnSeries = {
    series: [],
    i: [],
  }

  let candlestickSeries = {
    series: [],
    i: [],
  }

  let boxplotSeries = {
    series: [],
    i: [],
  }

  let rangeBarSeries = {
    series: [],
    i: [],
  }

  let rangeAreaSeries = {
    series: [],
    seriesRangeEnd: [],
    i: [],
  }

  gl.series.map((serie, st) => {
    let comboCount = 0
    // if user has specified a particular type for particular series
    if (typeof ser[st].type !== 'undefined') {
      if (ser[st].type === 'column' || ser[st].type === 'bar') {
        if (gl.series.length > 1 && cnf.plotOptions.bar.horizontal) {
          // horizontal bars not supported in mixed charts, hence show a warning
          console.warn(
            'Horizontal bars are not supported in a mixed/combo chart. Please turn off `plotOptions.bar.horizontal`'
          )
        }
        columnSeries.series.push(serie)
        columnSeries.i.push(st)
        comboCount++
        w.globals.columnSeries = columnSeries.series
      } else if (ser[st].type === 'area') {
        areaSeries.series.push(serie)
        areaSeries.i.push(st)
        comboCount++
      } else if (ser[st].type === 'line') {
        lineSeries.series.push(serie)
        lineSeries.i.push(st)
        comboCount++
      } else if (ser[st].type === 'scatter') {
        scatterSeries.series.push(serie)
        scatterSeries.i.push(st)
      } else if (ser[st].type === 'bubble') {
        bubbleSeries.series.push(serie)
        bubbleSeries.i.push(st)
        comboCount++
      } else if (ser[st].type === 'candlestick') {
        candlestickSeries.series.push(serie)
        candlestickSeries.i.push(st)
        comboCount++
      } else if (ser[st].type === 'boxPlot') {
        boxplotSeries.series.push(serie)
        boxplotSeries.i.push(st)
        comboCount++
      } else if (ser[st].type === 'rangeBar') {
        rangeBarSeries.series.push(serie)
        rangeBarSeries.i.push(st)
        comboCount++
      } else if (ser[st].type === 'rangeArea') {
        rangeAreaSeries.series.push(gl.seriesRangeStart[st])
        rangeAreaSeries.seriesRangeEnd.push(gl.seriesRangeEnd[st])
        rangeAreaSeries.i.push(st)
        comboCount++
      } else {
        // user has specified type, but it is not valid (other than line/area/column)
        console.warn(
          'You have specified an unrecognized chart type. Available types for this property are line/area/column/bar/scatter/bubble/candlestick/boxPlot/rangeBar/rangeArea'
        )
      }
      if (comboCount > 1) {
        gl.comboCharts = true
      }
    } else {
      lineSeries.series.push(serie)
      lineSeries.i.push(st)
    }
  })

  let line = new Line(this.ctx, xyRatios)
  let boxCandlestick = new BoxCandleStick(this.ctx, xyRatios)
  this.ctx.pie = new Pie(this.ctx)
  let radialBar = new Radial(this.ctx)
  this.ctx.rangeBar = new RangeBar(this.ctx, xyRatios)
  let radar = new Radar(this.ctx)
  let elGraph = []

  if (gl.comboCharts) {
    if (areaSeries.series.length > 0) {
      elGraph.push(line.draw(areaSeries.series, 'area', areaSeries.i))
    }
    if (columnSeries.series.length > 0) {
      if (w.config.chart.stacked) {
        let barStacked = new BarStacked(this.ctx, xyRatios)
        elGraph.push(barStacked.draw(columnSeries.series, columnSeries.i))
      } else {
        this.ctx.bar = new Bar(this.ctx, xyRatios)
        elGraph.push(this.ctx.bar.draw(columnSeries.series, columnSeries.i))
      }
    }
    if (rangeAreaSeries.series.length > 0) {
      elGraph.push(
        line.draw(
          rangeAreaSeries.series,
          'rangeArea',
          rangeAreaSeries.i,
          rangeAreaSeries.seriesRangeEnd
        )
      )
    }
    if (lineSeries.series.length > 0) {
      elGraph.push(line.draw(lineSeries.series, 'line', lineSeries.i))
    }
    if (candlestickSeries.series.length > 0) {
      elGraph.push(
        boxCandlestick.draw(
          candlestickSeries.series,
          'candlestick',
          candlestickSeries.i
        )
      )
    }
    if (boxplotSeries.series.length > 0) {
      elGraph.push(
        boxCandlestick.draw(boxplotSeries.series, 'boxPlot', boxplotSeries.i)
      )
    }
    if (rangeBarSeries.series.length > 0) {
      elGraph.push(
        this.ctx.rangeBar.draw(rangeBarSeries.series, rangeBarSeries.i)
      )
    }

    if (scatterSeries.series.length > 0) {
      const scatterLine = new Line(this.ctx, xyRatios, true)
      elGraph.push(
        scatterLine.draw(scatterSeries.series, 'scatter', scatterSeries.i)
      )
    }
    if (bubbleSeries.series.length > 0) {
      const bubbleLine = new Line(this.ctx, xyRatios, true)
      elGraph.push(
        bubbleLine.draw(bubbleSeries.series, 'bubble', bubbleSeries.i)
      )
    }
  } else {
    switch (cnf.chart.type) {
      case 'line':
        elGraph = line.draw(gl.series, 'line')
        break
      case 'area':
        elGraph = line.draw(gl.series, 'area')
        break
      case 'bar':
        if (cnf.chart.stacked) {
          let barStacked = new BarStacked(this.ctx, xyRatios)
          elGraph = barStacked.draw(gl.series)
        } else {
          this.ctx.bar = new Bar(this.ctx, xyRatios)
          elGraph = this.ctx.bar.draw(gl.series)
        }
        break
      case 'candlestick':
        let candleStick = new BoxCandleStick(this.ctx, xyRatios)
        elGraph = candleStick.draw(gl.series, 'candlestick')
        break
      case 'boxPlot':
        let boxPlot = new BoxCandleStick(this.ctx, xyRatios)
        elGraph = boxPlot.draw(gl.series, cnf.chart.type)
        break
      case 'rangeBar':
        elGraph = this.ctx.rangeBar.draw(gl.series)
        break
      case 'rangeArea':
        elGraph = line.draw(
          gl.seriesRangeStart,
          'rangeArea',
          undefined,
          gl.seriesRangeEnd
        )
        break
      case 'heatmap':
        let heatmap = new HeatMap(this.ctx, xyRatios)
        elGraph = heatmap.draw(gl.series)
        break
      case 'treemap':
        let treemap = new Treemap(this.ctx, xyRatios)
        elGraph = treemap.draw(gl.series)
        break
      case 'pie':
      case 'donut':
      case 'polarArea':
        elGraph = this.ctx.pie.draw(gl.series)
        break
      case 'radialBar':
        elGraph = radialBar.draw(gl.series)
        break
      case 'radar':
        elGraph = radar.draw(gl.series)
        break
      default:
        elGraph = line.draw(gl.series)
    }
  }

  return elGraph
}
