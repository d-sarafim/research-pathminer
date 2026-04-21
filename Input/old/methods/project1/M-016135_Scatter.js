centerTextInBubble(y) {
  let w = this.w
  y = y + parseInt(w.config.dataLabels.style.fontSize, 10) / 4

  return {
    y
  }
}
