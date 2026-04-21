constructor(ctx) {
  this.ctx = ctx
  this.w = ctx.w
  const w = this.w

  this.chartType = this.w.config.chart.type

  this.initialAnim = this.w.config.chart.animations.enabled
  this.dynamicAnim =
    this.initialAnim &&
    this.w.config.chart.animations.dynamicAnimation.enabled

  this.animBeginArr = [0]
  this.animDur = 0

  this.donutDataLabels = this.w.config.plotOptions.pie.donut.labels

  this.lineColorArr =
    w.globals.stroke.colors !== undefined
      ? w.globals.stroke.colors
      : w.globals.colors

  this.defaultSize = Math.min(w.globals.gridWidth, w.globals.gridHeight)

  this.centerY = this.defaultSize / 2
  this.centerX = w.globals.gridWidth / 2

  if (w.config.chart.type === 'radialBar') {
    this.fullAngle = 360
  } else {
    this.fullAngle = Math.abs(
      w.config.plotOptions.pie.endAngle - w.config.plotOptions.pie.startAngle
    )
  }
  this.initialAngle = w.config.plotOptions.pie.startAngle % this.fullAngle

  w.globals.radialSize =
    this.defaultSize / 2.05 -
    w.config.stroke.width -
    (!w.config.chart.sparkline.enabled ? w.config.chart.dropShadow.blur : 0)

  this.donutSize =
    (w.globals.radialSize *
      parseInt(w.config.plotOptions.pie.donut.size, 10)) /
    100

  this.maxY = 0
  this.sliceLabels = []
  this.sliceSizes = []

  this.prevSectorAngleArr = [] // for dynamic animations
}
