updateOverlayToRender(decoration) {
  const windowInnerHeight = this.getWindowInnerHeight();
  const windowInnerWidth = this.getWindowInnerWidth();
  const contentClientRect = this.refs.content.getBoundingClientRect();

  const { element, screenPosition, avoidOverflow } = decoration;
  const { row, column } = screenPosition;
  let wrapperTop =
    contentClientRect.top +
    this.pixelPositionAfterBlocksForRow(row) +
    this.getLineHeight();
  let wrapperLeft =
    contentClientRect.left + this.pixelLeftForRowAndColumn(row, column);
  const clientRect = element.getBoundingClientRect();

  if (avoidOverflow !== false) {
    const computedStyle = window.getComputedStyle(element);
    const elementTop = wrapperTop + parseInt(computedStyle.marginTop);
    const elementBottom = elementTop + clientRect.height;
    const flippedElementTop =
      wrapperTop -
      this.getLineHeight() -
      clientRect.height -
      parseInt(computedStyle.marginBottom);
    const elementLeft = wrapperLeft + parseInt(computedStyle.marginLeft);
    const elementRight = elementLeft + clientRect.width;

    if (elementBottom > windowInnerHeight && flippedElementTop >= 0) {
      wrapperTop -= elementTop - flippedElementTop;
    }
    if (elementLeft < 0) {
      wrapperLeft -= elementLeft;
    } else if (elementRight > windowInnerWidth) {
      wrapperLeft -= elementRight - windowInnerWidth;
    }
  }

  decoration.pixelTop = Math.round(wrapperTop);
  decoration.pixelLeft = Math.round(wrapperLeft);
}
