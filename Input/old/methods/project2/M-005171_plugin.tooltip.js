getCaretPosition(tooltipPoint, size, options) {
  const {xAlign, yAlign} = this;
  const {caretSize, cornerRadius} = options;
  const {topLeft, topRight, bottomLeft, bottomRight} = toTRBLCorners(cornerRadius);
  const {x: ptX, y: ptY} = tooltipPoint;
  const {width, height} = size;
  let x1, x2, x3, y1, y2, y3;

  if (yAlign === 'center') {
    y2 = ptY + (height / 2);

    if (xAlign === 'left') {
      x1 = ptX;
      x2 = x1 - caretSize;

      // Left draws bottom -> top, this y1 is on the bottom
      y1 = y2 + caretSize;
      y3 = y2 - caretSize;
    } else {
      x1 = ptX + width;
      x2 = x1 + caretSize;

      // Right draws top -> bottom, thus y1 is on the top
      y1 = y2 - caretSize;
      y3 = y2 + caretSize;
    }

    x3 = x1;
  } else {
    if (xAlign === 'left') {
      x2 = ptX + Math.max(topLeft, bottomLeft) + (caretSize);
    } else if (xAlign === 'right') {
      x2 = ptX + width - Math.max(topRight, bottomRight) - caretSize;
    } else {
      x2 = this.caretX;
    }

    if (yAlign === 'top') {
      y1 = ptY;
      y2 = y1 - caretSize;

      // Top draws left -> right, thus x1 is on the left
      x1 = x2 - caretSize;
      x3 = x2 + caretSize;
    } else {
      y1 = ptY + height;
      y2 = y1 + caretSize;

      // Bottom draws right -> left, thus x1 is on the right
      x1 = x2 + caretSize;
      x3 = x2 - caretSize;
    }
    y3 = y1;
  }
  return {x1, x2, x3, y1, y2, y3};
}
