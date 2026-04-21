animatePaths(el, opts) {
  let w = this.w
  let me = this

  let angle =
    opts.endAngle < opts.startAngle
      ? this.fullAngle + opts.endAngle - opts.startAngle
      : opts.endAngle - opts.startAngle
  let prevAngle = angle

  let fromStartAngle = opts.startAngle
  let toStartAngle = opts.startAngle

  if (opts.prevStartAngle !== undefined && opts.prevEndAngle !== undefined) {
    fromStartAngle = opts.prevEndAngle
    prevAngle =
      opts.prevEndAngle < opts.prevStartAngle
        ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle
        : opts.prevEndAngle - opts.prevStartAngle
  }
  if (opts.i === w.config.series.length - 1) {
    // some adjustments for the last overlapping paths
    if (angle + toStartAngle > this.fullAngle) {
      opts.endAngle = opts.endAngle - (angle + toStartAngle)
    } else if (angle + toStartAngle < this.fullAngle) {
      opts.endAngle =
        opts.endAngle + (this.fullAngle - (angle + toStartAngle))
    }
  }

  if (angle === this.fullAngle) angle = this.fullAngle - 0.01

  me.animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts)
}
