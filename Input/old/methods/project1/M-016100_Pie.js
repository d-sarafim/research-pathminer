addListeners(elPath, dataLabels) {
  const graphics = new Graphics(this.ctx)
  // append filters on mouseenter and mouseleave
  elPath.node.addEventListener(
    'mouseenter',
    graphics.pathMouseEnter.bind(this, elPath)
  )

  elPath.node.addEventListener(
    'mouseleave',
    graphics.pathMouseLeave.bind(this, elPath)
  )
  elPath.node.addEventListener(
    'mouseleave',
    this.revertDataLabelsInner.bind(this, elPath.node, dataLabels)
  )
  elPath.node.addEventListener(
    'mousedown',
    graphics.pathMouseDown.bind(this, elPath)
  )

  if (!this.donutDataLabels.total.showAlways) {
    elPath.node.addEventListener(
      'mouseenter',
      this.printDataLabelsInner.bind(this, elPath.node, dataLabels)
    )

    elPath.node.addEventListener(
      'mousedown',
      this.printDataLabelsInner.bind(this, elPath.node, dataLabels)
    )
  }
}
