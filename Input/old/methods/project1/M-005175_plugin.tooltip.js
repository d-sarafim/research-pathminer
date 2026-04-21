drawFooter(pt, ctx, options) {
  const footer = this.footer;
  const length = footer.length;
  let footerFont, i;

  if (length) {
    const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);

    pt.x = getAlignedX(this, options.footerAlign, options);
    pt.y += options.footerMarginTop;

    ctx.textAlign = rtlHelper.textAlign(options.footerAlign);
    ctx.textBaseline = 'middle';

    footerFont = toFont(options.footerFont);

    ctx.fillStyle = options.footerColor;
    ctx.font = footerFont.string;

    for (i = 0; i < length; ++i) {
      ctx.fillText(footer[i], rtlHelper.x(pt.x), pt.y + footerFont.lineHeight / 2);
      pt.y += footerFont.lineHeight + options.footerSpacing;
    }
  }
}
