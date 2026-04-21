adjustHitBoxes() {
  if (!this.options.display) {
    return;
  }
  const titleHeight = this._computeTitleHeight();
  const {legendHitBoxes: hitboxes, options: {align, labels: {padding}, rtl}} = this;
  const rtlHelper = getRtlAdapter(rtl, this.left, this.width);
  if (this.isHorizontal()) {
    let row = 0;
    let left = _alignStartEnd(align, this.left + padding, this.right - this.lineWidths[row]);
    for (const hitbox of hitboxes) {
      if (row !== hitbox.row) {
        row = hitbox.row;
        left = _alignStartEnd(align, this.left + padding, this.right - this.lineWidths[row]);
      }
      hitbox.top += this.top + titleHeight + padding;
      hitbox.left = rtlHelper.leftForLtr(rtlHelper.x(left), hitbox.width);
      left += hitbox.width + padding;
    }
  } else {
    let col = 0;
    let top = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - this.columnSizes[col].height);
    for (const hitbox of hitboxes) {
      if (hitbox.col !== col) {
        col = hitbox.col;
        top = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - this.columnSizes[col].height);
      }
      hitbox.top = top;
      hitbox.left += this.left + padding;
      hitbox.left = rtlHelper.leftForLtr(rtlHelper.x(hitbox.left), hitbox.width);
      top += hitbox.height + padding;
    }
  }
}
