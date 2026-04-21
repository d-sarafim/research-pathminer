_drawArgs(offset) {
  const {top, left, bottom, right, options} = this;
  const align = options.align;
  let rotation = 0;
  let maxWidth, titleX, titleY;

  if (this.isHorizontal()) {
    titleX = _alignStartEnd(align, left, right);
    titleY = top + offset;
    maxWidth = right - left;
  } else {
    if (options.position === 'left') {
      titleX = left + offset;
      titleY = _alignStartEnd(align, bottom, top);
      rotation = PI * -0.5;
    } else {
      titleX = right - offset;
      titleY = _alignStartEnd(align, top, bottom);
      rotation = PI * 0.5;
    }
    maxWidth = bottom - top;
  }
  return {titleX, titleY, maxWidth, rotation};
}
