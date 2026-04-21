fillPath(opts) {
  let w = this.w
  this.opts = opts

  let cnf = this.w.config
  let pathFill

  let patternFill, gradientFill

  this.seriesIndex = this.getSeriesIndex(opts)

  let fillColors = this.getFillColors()
  let fillColor = fillColors[this.seriesIndex]

  //override fillcolor if user inputted color with data
  if (w.globals.seriesColors[this.seriesIndex] !== undefined) {
    fillColor = w.globals.seriesColors[this.seriesIndex]
  }

  if (typeof fillColor === 'function') {
    fillColor = fillColor({
      seriesIndex: this.seriesIndex,
      dataPointIndex: opts.dataPointIndex,
      value: opts.value,
      w,
    })
  }
  let fillType = opts.fillType
    ? opts.fillType
    : this.getFillType(this.seriesIndex)
  let fillOpacity = Array.isArray(cnf.fill.opacity)
    ? cnf.fill.opacity[this.seriesIndex]
    : cnf.fill.opacity

  if (opts.color) {
    fillColor = opts.color
  }

  let defaultColor = fillColor

  if (fillColor.indexOf('rgb') === -1) {
    if (fillColor.length < 9) {
      // if the hex contains alpha and is of 9 digit, skip the opacity
      defaultColor = Utils.hexToRgba(fillColor, fillOpacity)
    }
  } else {
    if (fillColor.indexOf('rgba') > -1) {
      fillOpacity = Utils.getOpacityFromRGBA(fillColor)
    }
  }
  if (opts.opacity) fillOpacity = opts.opacity

  if (fillType === 'pattern') {
    patternFill = this.handlePatternFill({
      fillConfig: opts.fillConfig,
      patternFill,
      fillColor,
      fillOpacity,
      defaultColor,
    })
  }

  if (fillType === 'gradient') {
    gradientFill = this.handleGradientFill({
      fillConfig: opts.fillConfig,
      fillColor,
      fillOpacity,
      i: this.seriesIndex,
    })
  }

  if (fillType === 'image') {
    let imgSrc = cnf.fill.image.src

    let patternID = opts.patternID ? opts.patternID : ''
    this.clippedImgArea({
      opacity: fillOpacity,
      image: Array.isArray(imgSrc)
        ? opts.seriesNumber < imgSrc.length
          ? imgSrc[opts.seriesNumber]
          : imgSrc[0]
        : imgSrc,
      width: opts.width ? opts.width : undefined,
      height: opts.height ? opts.height : undefined,
      patternUnits: opts.patternUnits,
      patternID: `pattern${w.globals.cuid}${
        opts.seriesNumber + 1
      }${patternID}`,
    })
    pathFill = `url(#pattern${w.globals.cuid}${
      opts.seriesNumber + 1
    }${patternID})`
  } else if (fillType === 'gradient') {
    pathFill = gradientFill
  } else if (fillType === 'pattern') {
    pathFill = patternFill
  } else {
    pathFill = defaultColor
  }

  // override pattern/gradient if opts.solid is true
  if (opts.solid) {
    pathFill = defaultColor
  }

  return pathFill
}
