setDefaultColors() {
  let w = this.w
  let utils = new Utils()

  w.globals.dom.elWrap.classList.add(
    `apexcharts-theme-${w.config.theme.mode}`
  )

  if (w.config.colors === undefined || w.config.colors?.length === 0) {
    w.globals.colors = this.predefined()
  } else {
    w.globals.colors = w.config.colors

    // if user provided a function in colors, we need to eval here
    if (
      Array.isArray(w.config.colors) &&
      w.config.colors.length > 0 &&
      typeof w.config.colors[0] === 'function'
    ) {
      w.globals.colors = w.config.series.map((s, i) => {
        let c = w.config.colors[i]
        if (!c) c = w.config.colors[0]
        if (typeof c === 'function') {
          this.isColorFn = true
          return c({
            value: w.globals.axisCharts
              ? w.globals.series[i][0]
                ? w.globals.series[i][0]
                : 0
              : w.globals.series[i],
            seriesIndex: i,
            dataPointIndex: i,
            w,
          })
        }
        return c
      })
    }
  }

  // user defined colors in series array
  w.globals.seriesColors.map((c, i) => {
    if (c) {
      w.globals.colors[i] = c
    }
  })

  if (w.config.theme.monochrome.enabled) {
    let monoArr = []
    let glsCnt = w.globals.series.length
    if (this.isBarDistributed || this.isHeatmapDistributed) {
      glsCnt = w.globals.series[0].length * w.globals.series.length
    }

    let mainColor = w.config.theme.monochrome.color
    let part = 1 / (glsCnt / w.config.theme.monochrome.shadeIntensity)
    let shade = w.config.theme.monochrome.shadeTo
    let percent = 0

    for (let gsl = 0; gsl < glsCnt; gsl++) {
      let newColor

      if (shade === 'dark') {
        newColor = utils.shadeColor(percent * -1, mainColor)
        percent = percent + part
      } else {
        newColor = utils.shadeColor(percent, mainColor)
        percent = percent + part
      }

      monoArr.push(newColor)
    }
    w.globals.colors = monoArr.slice()
  }
  const defaultColors = w.globals.colors.slice()

  // if user specified fewer colors than no. of series, push the same colors again
  this.pushExtraColors(w.globals.colors)

  const colorTypes = ['fill', 'stroke']
  colorTypes.forEach((c) => {
    if (w.config[c].colors === undefined) {
      w.globals[c].colors = this.isColorFn ? w.config.colors : defaultColors
    } else {
      w.globals[c].colors = w.config[c].colors.slice()
    }
    this.pushExtraColors(w.globals[c].colors)
  })

  if (w.config.dataLabels.style.colors === undefined) {
    w.globals.dataLabels.style.colors = defaultColors
  } else {
    w.globals.dataLabels.style.colors =
      w.config.dataLabels.style.colors.slice()
  }
  this.pushExtraColors(w.globals.dataLabels.style.colors, 50)

  if (w.config.plotOptions.radar.polygons.fill.colors === undefined) {
    w.globals.radarPolygons.fill.colors = [
      w.config.theme.mode === 'dark' ? '#424242' : 'none',
    ]
  } else {
    w.globals.radarPolygons.fill.colors =
      w.config.plotOptions.radar.polygons.fill.colors.slice()
  }
  this.pushExtraColors(w.globals.radarPolygons.fill.colors, 20)

  // The point colors
  if (w.config.markers.colors === undefined) {
    w.globals.markers.colors = defaultColors
  } else {
    w.globals.markers.colors = w.config.markers.colors.slice()
  }
  this.pushExtraColors(w.globals.markers.colors)
}
