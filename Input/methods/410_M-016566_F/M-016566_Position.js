moveXAxisTooltip(cx) {
  let w = this.w
  const ttCtx = this.ttCtx

  if (ttCtx.xaxisTooltip !== null && ttCtx.xcrosshairsWidth !== 0) {
    ttCtx.xaxisTooltip.classList.add('apexcharts-active')

    let cy =
      ttCtx.xaxisOffY +
      w.config.xaxis.tooltip.offsetY +
      w.globals.translateY +
      1 +
      w.config.xaxis.offsetY

    let xaxisTTText = ttCtx.xaxisTooltip.getBoundingClientRect()
    let xaxisTTTextWidth = xaxisTTText.width

    cx = cx - xaxisTTTextWidth / 2

    if (!isNaN(cx)) {
      cx = cx + w.globals.translateX

      let textRect = 0
      const graphics = new Graphics(this.ctx)
      textRect = graphics.getTextRects(ttCtx.xaxisTooltipText.innerHTML)

      ttCtx.xaxisTooltipText.style.minWidth = textRect.width + 'px'
      ttCtx.xaxisTooltip.style.left = cx + 'px'
      ttCtx.xaxisTooltip.style.top = cy + 'px'
    }
  }
}
