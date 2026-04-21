handleGradientFill({ fillColor, fillOpacity, fillConfig, i }) {
  let fillCnf = this.w.config.fill

  if (fillConfig) {
    fillCnf = {
      ...fillCnf,
      ...fillConfig,
    }
  }
  const opts = this.opts
  let graphics = new Graphics(this.ctx)
  let utils = new Utils()

  let type = fillCnf.gradient.type
  let gradientFrom = fillColor
  let gradientTo
  let opacityFrom =
    fillCnf.gradient.opacityFrom === undefined
      ? fillOpacity
      : Array.isArray(fillCnf.gradient.opacityFrom)
      ? fillCnf.gradient.opacityFrom[i]
      : fillCnf.gradient.opacityFrom

  if (gradientFrom.indexOf('rgba') > -1) {
    opacityFrom = Utils.getOpacityFromRGBA(gradientFrom)
  }
  let opacityTo =
    fillCnf.gradient.opacityTo === undefined
      ? fillOpacity
      : Array.isArray(fillCnf.gradient.opacityTo)
      ? fillCnf.gradient.opacityTo[i]
      : fillCnf.gradient.opacityTo

  if (
    fillCnf.gradient.gradientToColors === undefined ||
    fillCnf.gradient.gradientToColors.length === 0
  ) {
    if (fillCnf.gradient.shade === 'dark') {
      gradientTo = utils.shadeColor(
        parseFloat(fillCnf.gradient.shadeIntensity) * -1,
        fillColor.indexOf('rgb') > -1 ? Utils.rgb2hex(fillColor) : fillColor
      )
    } else {
      gradientTo = utils.shadeColor(
        parseFloat(fillCnf.gradient.shadeIntensity),
        fillColor.indexOf('rgb') > -1 ? Utils.rgb2hex(fillColor) : fillColor
      )
    }
  } else {
    if (fillCnf.gradient.gradientToColors[opts.seriesNumber]) {
      const gToColor = fillCnf.gradient.gradientToColors[opts.seriesNumber]
      gradientTo = gToColor
      if (gToColor.indexOf('rgba') > -1) {
        opacityTo = Utils.getOpacityFromRGBA(gToColor)
      }
    } else {
      gradientTo = fillColor
    }
  }

  if (fillCnf.gradient.gradientFrom) {
    gradientFrom = fillCnf.gradient.gradientFrom
  }
  if (fillCnf.gradient.gradientTo) {
    gradientTo = fillCnf.gradient.gradientTo
  }

  if (fillCnf.gradient.inverseColors) {
    let t = gradientFrom
    gradientFrom = gradientTo
    gradientTo = t
  }

  if (gradientFrom.indexOf('rgb') > -1) {
    gradientFrom = Utils.rgb2hex(gradientFrom)
  }
  if (gradientTo.indexOf('rgb') > -1) {
    gradientTo = Utils.rgb2hex(gradientTo)
  }

  return graphics.drawGradient(
    type,
    gradientFrom,
    gradientTo,
    opacityFrom,
    opacityTo,
    opts.size,
    fillCnf.gradient.stops,
    fillCnf.gradient.colorStops,
    i
  )
}
