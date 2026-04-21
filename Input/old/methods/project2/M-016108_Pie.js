printInnerLabels(labelsConfig, name, val, el) {
  const w = this.w

  let labelColor

  if (el) {
    if (labelsConfig.name.color === undefined) {
      labelColor =
        w.globals.colors[parseInt(el.parentNode.getAttribute('rel'), 10) - 1]
    } else {
      labelColor = labelsConfig.name.color
    }
  } else {
    if (w.globals.series.length > 1 && labelsConfig.total.show) {
      labelColor = labelsConfig.total.color
    }
  }

  let elLabel = w.globals.dom.baseEl.querySelector(
    '.apexcharts-datalabel-label'
  )
  let elValue = w.globals.dom.baseEl.querySelector(
    '.apexcharts-datalabel-value'
  )

  let lbFormatter = labelsConfig.value.formatter
  val = lbFormatter(val, w)

  // we need to show Total Val - so get the formatter of it
  if (!el && typeof labelsConfig.total.formatter === 'function') {
    val = labelsConfig.total.formatter(w)
  }

  const isTotal = name === labelsConfig.total.label
  name = labelsConfig.name.formatter(name, isTotal, w)

  if (elLabel !== null) {
    elLabel.textContent = name
  }

  if (elValue !== null) {
    elValue.textContent = val
  }
  if (elLabel !== null) {
    elLabel.style.fill = labelColor
  }
}
