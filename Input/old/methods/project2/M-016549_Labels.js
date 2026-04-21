printLabels({ i, j, values, ttItems, shared, e }) {
  const w = this.w
  let val
  let goalVals = []
  const hasGoalValues = (gi) => {
    return (
      w.globals.seriesGoals[gi] &&
      w.globals.seriesGoals[gi][j] &&
      Array.isArray(w.globals.seriesGoals[gi][j])
    )
  }

  const { xVal, zVal, xAxisTTVal } = values

  let seriesName = ''

  let pColor = w.globals.colors[i] // The pColor here is for the markers inside tooltip
  if (j !== null && w.config.plotOptions.bar.distributed) {
    pColor = w.globals.colors[j]
  }

  for (
    let t = 0, inverset = w.globals.series.length - 1;
    t < w.globals.series.length;
    t++, inverset--
  ) {
    let f = this.getFormatters(i)
    seriesName = this.getSeriesName({
      fn: f.yLbTitleFormatter,
      index: i,
      seriesIndex: i,
      j
    })

    if (w.config.chart.type === 'treemap') {
      seriesName = f.yLbTitleFormatter(String(w.config.series[i].data[j].x), {
        series: w.globals.series,
        seriesIndex: i,
        dataPointIndex: j,
        w
      })
    }

    const tIndex = w.config.tooltip.inverseOrder ? inverset : t

    if (w.globals.axisCharts) {
      const getValBySeriesIndex = (index) => {
        if (w.globals.isRangeData) {
          return (
            f.yLbFormatter(w.globals.seriesRangeStart?.[index]?.[j], {
              series: w.globals.seriesRangeStart,
              seriesIndex: index,
              dataPointIndex: j,
              w
            }) +
            ' - ' +
            f.yLbFormatter(w.globals.seriesRangeEnd?.[index]?.[j], {
              series: w.globals.seriesRangeEnd,
              seriesIndex: index,
              dataPointIndex: j,
              w
            })
          )
        }
        return f.yLbFormatter(w.globals.series[index][j], {
          series: w.globals.series,
          seriesIndex: index,
          dataPointIndex: j,
          w
        })
      }
      if (shared) {
        f = this.getFormatters(tIndex)

        seriesName = this.getSeriesName({
          fn: f.yLbTitleFormatter,
          index: tIndex,
          seriesIndex: i,
          j
        })
        pColor = w.globals.colors[tIndex]

        val = getValBySeriesIndex(tIndex)
        if (hasGoalValues(tIndex)) {
          goalVals = w.globals.seriesGoals[tIndex][j].map((goal) => {
            return {
              attrs: goal,
              val: f.yLbFormatter(goal.value, {
                seriesIndex: tIndex,
                dataPointIndex: j,
                w
              })
            }
          })
        }
      } else {
        // get a color from a hover area (if it's a line pattern then get from a first line)
        const targetFill = e?.target?.getAttribute('fill')
        if (targetFill) {
          pColor =
            targetFill.indexOf('url') !== -1
              ? document
                  .querySelector(targetFill.substr(4).slice(0, -1))
                  .childNodes[0].getAttribute('stroke')
              : targetFill
        }
        val = getValBySeriesIndex(i)
        if (hasGoalValues(i) && Array.isArray(w.globals.seriesGoals[i][j])) {
          goalVals = w.globals.seriesGoals[i][j].map((goal) => {
            return {
              attrs: goal,
              val: f.yLbFormatter(goal.value, {
                seriesIndex: i,
                dataPointIndex: j,
                w
              })
            }
          })
        }
      }
    }

    // for pie / donuts
    if (j === null) {
      val = f.yLbFormatter(w.globals.series[i], {
        ...w,
        seriesIndex: i,
        dataPointIndex: i
      })
    }

    this.DOMHandling({
      i,
      t: tIndex,
      j,
      ttItems,
      values: {
        val,
        goalVals,
        xVal,
        xAxisTTVal,
        zVal
      },
      seriesName,
      shared,
      pColor
    })
  }
}
