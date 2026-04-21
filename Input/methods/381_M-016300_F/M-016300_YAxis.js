getyAxisTitleCoords() {
  let w = this.w
  let ret = []

  w.config.yaxis.map((yaxe, index) => {
    if (yaxe.show && yaxe.title.text !== undefined) {
      let graphics = new Graphics(this.dCtx.ctx)
      let rotateStr = 'rotate('.concat(yaxe.title.rotate, ' 0 0)')
      let rect = graphics.getTextRects(
        yaxe.title.text,
        yaxe.title.style.fontSize,
        yaxe.title.style.fontFamily,
        rotateStr,
        false
      )

      ret.push({
        width: rect.width,
        height: rect.height,
      })
    } else {
      ret.push({
        width: 0,
        height: 0,
      })
    }
  })

  return ret
}
