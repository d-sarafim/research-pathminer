clone() {
  const scale = this.getScale();
  return new Text({
    font: this.getFont(),
    placement: this.getPlacement(),
    repeat: this.getRepeat(),
    maxAngle: this.getMaxAngle(),
    overflow: this.getOverflow(),
    rotation: this.getRotation(),
    rotateWithView: this.getRotateWithView(),
    scale: Array.isArray(scale) ? scale.slice() : scale,
    text: this.getText(),
    textAlign: this.getTextAlign(),
    justify: this.getJustify(),
    textBaseline: this.getTextBaseline(),
    fill: this.getFill() ? this.getFill().clone() : undefined,
    stroke: this.getStroke() ? this.getStroke().clone() : undefined,
    offsetX: this.getOffsetX(),
    offsetY: this.getOffsetY(),
    backgroundFill: this.getBackgroundFill()
      ? this.getBackgroundFill().clone()
      : undefined,
    backgroundStroke: this.getBackgroundStroke()
      ? this.getBackgroundStroke().clone()
      : undefined,
    padding: this.getPadding() || undefined,
  });
}
