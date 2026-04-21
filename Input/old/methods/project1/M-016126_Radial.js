getStrokeWidth(opts) {
  const w = this.w
  return (
    (opts.size *
      (100 - parseInt(w.config.plotOptions.radialBar.hollow.size, 10))) /
      100 /
      (opts.series.length + 1) -
    this.margin
  )
}
