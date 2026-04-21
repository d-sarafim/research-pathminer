getLabel(
  labels,
  timescaleLabels,
  x,
  i,
  drawnLabels = [],
  fontSize = '12px',
  isLeafGroup = true
) {
  const w = this.w
  let rawLabel = typeof labels[i] === 'undefined' ? '' : labels[i]
  let label = rawLabel

  let xlbFormatter = w.globals.xLabelFormatter
  let customFormatter = w.config.xaxis.labels.formatter

  let isBold = false

  let xFormat = new Formatters(this.ctx)
  let timestamp = rawLabel

  if (isLeafGroup) {
    label = xFormat.xLabelFormat(xlbFormatter, rawLabel, timestamp, {
      i,
      dateFormatter: new DateTime(this.ctx).formatDate,
      w
    })

    if (customFormatter !== undefined) {
      label = customFormatter(rawLabel, labels[i], {
        i,
        dateFormatter: new DateTime(this.ctx).formatDate,
        w
      })
    }
  }

  const determineHighestUnit = (unit) => {
    let highestUnit = null
    timescaleLabels.forEach((t) => {
      if (t.unit === 'month') {
        highestUnit = 'year'
      } else if (t.unit === 'day') {
        highestUnit = 'month'
      } else if (t.unit === 'hour') {
        highestUnit = 'day'
      } else if (t.unit === 'minute') {
        highestUnit = 'hour'
      }
    })

    return highestUnit === unit
  }
  if (timescaleLabels.length > 0) {
    isBold = determineHighestUnit(timescaleLabels[i].unit)
    x = timescaleLabels[i].position
    label = timescaleLabels[i].value
  } else {
    if (w.config.xaxis.type === 'datetime' && customFormatter === undefined) {
      label = ''
    }
  }

  if (typeof label === 'undefined') label = ''

  label = Array.isArray(label) ? label : label.toString()

  let graphics = new Graphics(this.ctx)
  let textRect = {}
  if (w.globals.rotateXLabels && isLeafGroup) {
    textRect = graphics.getTextRects(
      label,
      parseInt(fontSize, 10),
      null,
      `rotate(${w.config.xaxis.labels.rotate} 0 0)`,
      false
    )
  } else {
    textRect = graphics.getTextRects(label, parseInt(fontSize, 10))
  }

  const allowDuplicatesInTimeScale =
    !w.config.xaxis.labels.showDuplicates && this.ctx.timeScale

  if (
    !Array.isArray(label) &&
    (label.indexOf('NaN') === 0 ||
      label.toLowerCase().indexOf('invalid') === 0 ||
      label.toLowerCase().indexOf('infinity') >= 0 ||
      (drawnLabels.indexOf(label) >= 0 && allowDuplicatesInTimeScale))
  ) {
    label = ''
  }

  return {
    x,
    text: label,
    textRect,
    isBold
  }
}
