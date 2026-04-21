drawGradient(
  style,
  gfrom,
  gto,
  opacityFrom,
  opacityTo,
  size = null,
  stops = null,
  colorStops = null,
  i = 0
) {
  let w = this.w
  let g

  if (gfrom.length < 9 && gfrom.indexOf('#') === 0) {
    // if the hex contains alpha and is of 9 digit, skip the opacity
    gfrom = Utils.hexToRgba(gfrom, opacityFrom)
  }
  if (gto.length < 9 && gto.indexOf('#') === 0) {
    gto = Utils.hexToRgba(gto, opacityTo)
  }

  let stop1 = 0
  let stop2 = 1
  let stop3 = 1
  let stop4 = null

  if (stops !== null) {
    stop1 = typeof stops[0] !== 'undefined' ? stops[0] / 100 : 0
    stop2 = typeof stops[1] !== 'undefined' ? stops[1] / 100 : 1
    stop3 = typeof stops[2] !== 'undefined' ? stops[2] / 100 : 1
    stop4 = typeof stops[3] !== 'undefined' ? stops[3] / 100 : null
  }

  let radial = !!(
    w.config.chart.type === 'donut' ||
    w.config.chart.type === 'pie' ||
    w.config.chart.type === 'polarArea' ||
    w.config.chart.type === 'bubble'
  )

  if (colorStops === null || colorStops.length === 0) {
    g = w.globals.dom.Paper.gradient(radial ? 'radial' : 'linear', (stop) => {
      stop.at(stop1, gfrom, opacityFrom)
      stop.at(stop2, gto, opacityTo)
      stop.at(stop3, gto, opacityTo)
      if (stop4 !== null) {
        stop.at(stop4, gfrom, opacityFrom)
      }
    })
  } else {
    g = w.globals.dom.Paper.gradient(radial ? 'radial' : 'linear', (stop) => {
      let gradientStops = Array.isArray(colorStops[i])
        ? colorStops[i]
        : colorStops
      gradientStops.forEach((s) => {
        stop.at(s.offset / 100, s.color, s.opacity)
      })
    })
  }

  if (!radial) {
    if (style === 'vertical') {
      g.from(0, 0).to(0, 1)
    } else if (style === 'diagonal') {
      g.from(0, 0).to(1, 1)
    } else if (style === 'horizontal') {
      g.from(0, 1).to(1, 1)
    } else if (style === 'diagonal2') {
      g.from(1, 0).to(0, 1)
    }
  } else {
    let offx = w.globals.gridWidth / 2
    let offy = w.globals.gridHeight / 2

    if (w.config.chart.type !== 'bubble') {
      g.attr({
        gradientUnits: 'userSpaceOnUse',
        cx: offx,
        cy: offy,
        r: size
      })
    } else {
      g.attr({
        cx: 0.5,
        cy: 0.5,
        r: 0.8,
        fx: 0.2,
        fy: 0.2
      })
    }
  }

  return g
}
