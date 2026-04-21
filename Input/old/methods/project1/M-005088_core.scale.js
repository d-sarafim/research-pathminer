drawBorder() {
  const {chart, ctx, options: {border, grid}} = this;
  const borderOpts = border.setContext(this.getContext());
  const axisWidth = border.display ? borderOpts.width : 0;
  if (!axisWidth) {
    return;
  }
  const lastLineWidth = grid.setContext(this.getContext(0)).lineWidth;
  const borderValue = this._borderValue;
  let x1, x2, y1, y2;

  if (this.isHorizontal()) {
    x1 = _alignPixel(chart, this.left, axisWidth) - axisWidth / 2;
    x2 = _alignPixel(chart, this.right, lastLineWidth) + lastLineWidth / 2;
    y1 = y2 = borderValue;
  } else {
    y1 = _alignPixel(chart, this.top, axisWidth) - axisWidth / 2;
    y2 = _alignPixel(chart, this.bottom, lastLineWidth) + lastLineWidth / 2;
    x1 = x2 = borderValue;
  }
  ctx.save();
  ctx.lineWidth = borderOpts.width;
  ctx.strokeStyle = borderOpts.color;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.restore();
}
