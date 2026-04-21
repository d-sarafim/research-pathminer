handleDownload(type) {
  const w = this.w
  const exprt = new Exports(this.ctx)
  switch (type) {
    case 'svg':
      exprt.exportToSVG(this.ctx)
      break
    case 'png':
      exprt.exportToPng(this.ctx)
      break
    case 'csv':
      exprt.exportToCSV({
        series: w.config.series,
        columnDelimiter: w.config.chart.toolbar.export.csv.columnDelimiter
      })
      break
  }
}
