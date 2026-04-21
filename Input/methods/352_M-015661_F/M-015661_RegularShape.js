draw_(renderOptions, context, pixelRatio) {
  context.scale(pixelRatio, pixelRatio);
  // set origin to canvas center
  context.translate(renderOptions.size / 2, renderOptions.size / 2);

  this.createPath_(context);

  if (this.fill_) {
    let color = this.fill_.getColor();
    if (color === null) {
      color = defaultFillStyle;
    }
    context.fillStyle = asColorLike(color);
    context.fill();
  }
  if (this.stroke_) {
    context.strokeStyle = renderOptions.strokeStyle;
    context.lineWidth = renderOptions.strokeWidth;
    if (renderOptions.lineDash) {
      context.setLineDash(renderOptions.lineDash);
      context.lineDashOffset = renderOptions.lineDashOffset;
    }
    context.lineCap = renderOptions.lineCap;
    context.lineJoin = renderOptions.lineJoin;
    context.miterLimit = renderOptions.miterLimit;
    context.stroke();
  }
}
