_drawGridLine({ i, x1, y1, x2, y2, xCount, parent }) {
  const w = this.w
  let excludeBorders = false

  const isHorzLine = parent.node.classList.contains(
    'apexcharts-gridlines-horizontal'
  )

  let strokeDashArray = w.config.grid.strokeDashArray
  const offX = w.globals.barPadForNumericAxis
  if ((y1 === 0 && y2 === 0) || (x1 === 0 && x2 === 0)) {
    excludeBorders = true
  }
  if (y1 === w.globals.gridHeight && y2 === w.globals.gridHeight) {
    excludeBorders = true
  }
  if (w.globals.isBarHorizontal && (i === 0 || i === xCount - 1)) {
    excludeBorders = true
  }

  const graphics = new Graphics(this)
  let line = graphics.drawLine(
    x1 - (isHorzLine ? offX : 0),
    y1,
    x2 + (isHorzLine ? offX : 0),
    y2,
    w.config.grid.borderColor,
    strokeDashArray
  )
  line.node.classList.add('apexcharts-gridline')

  if (excludeBorders && w.config.grid.show) {
    this.elGridBorders.add(line)
  } else {
    parent.add(line)
  }
}
