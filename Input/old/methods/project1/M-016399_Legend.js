onLegendHovered(e) {
  const w = this.w

  const hoverOverLegend =
    e.target.classList.contains('apexcharts-legend-series') ||
    e.target.classList.contains('apexcharts-legend-text') ||
    e.target.classList.contains('apexcharts-legend-marker')

  if (w.config.chart.type !== 'heatmap' && !this.isBarsDistributed) {
    if (
      !e.target.classList.contains('apexcharts-inactive-legend') &&
      hoverOverLegend
    ) {
      let series = new Series(this.ctx)
      series.toggleSeriesOnHover(e, e.target)
    }
  } else {
    // for heatmap handling
    if (hoverOverLegend) {
      let seriesCnt = parseInt(e.target.getAttribute('rel'), 10) - 1
      this.ctx.events.fireEvent('legendHover', [this.ctx, seriesCnt, this.w])

      let series = new Series(this.ctx)
      series.highlightRangeInSeries(e, e.target)
    }
  }
}
