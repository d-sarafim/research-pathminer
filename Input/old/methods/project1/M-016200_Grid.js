_drawGridBandRect({ c, x1, y1, x2, y2, type }) {
  const w = this.w
  const graphics = new Graphics(this.ctx)
  const offX = w.globals.barPadForNumericAxis

  if (type === 'column' && w.config.xaxis.type === 'datetime') return

  const color = w.config.grid[type].colors[c]

  let rect = graphics.drawRect(
    x1 - (type === 'row' ? offX : 0),
    y1,
    x2 + (type === 'row' ? offX * 2 : 0),
    y2,
    0,
    color,
    w.config.grid[type].opacity
  )
  this.elg.add(rect)
  rect.attr('clip-path', `url(#gridRectMask${w.globals.cuid})`)
  rect.node.classList.add(`apexcharts-grid-${type}`)
}
