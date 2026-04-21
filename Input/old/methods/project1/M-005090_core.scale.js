drawTitle() {
  const {ctx, options: {position, title, reverse}} = this;

  if (!title.display) {
    return;
  }

  const font = toFont(title.font);
  const padding = toPadding(title.padding);
  const align = title.align;
  let offset = font.lineHeight / 2;

  if (position === 'bottom' || position === 'center' || isObject(position)) {
    offset += padding.bottom;
    if (isArray(title.text)) {
      offset += font.lineHeight * (title.text.length - 1);
    }
  } else {
    offset += padding.top;
  }

  const {titleX, titleY, maxWidth, rotation} = titleArgs(this, offset, position, align);

  renderText(ctx, title.text, 0, 0, font, {
    color: title.color,
    maxWidth,
    rotation,
    textAlign: titleAlign(align, position, reverse),
    textBaseline: 'middle',
    translation: [titleX, titleY],
  });
}
