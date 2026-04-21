makeSelectionRectDraggable() {
  const w = this.w

  if (!this.selectionRect) return

  const rectDim = this.selectionRect.node.getBoundingClientRect()
  if (rectDim.width > 0 && rectDim.height > 0) {
    this.slDraggableRect
      .selectize({
        points: 'l, r',
        pointSize: 8,
        pointType: 'rect'
      })
      .resize({
        constraint: {
          minX: 0,
          minY: 0,
          maxX: w.globals.gridWidth,
          maxY: w.globals.gridHeight
        }
      })
      .on('resizing', this.selectionDragging.bind(this, 'resizing'))
  }
}
