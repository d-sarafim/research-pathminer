getEventPixel(event) {
  const viewport = this.viewport_;
  const viewportPosition = viewport.getBoundingClientRect();
  const viewportSize = this.getSize();
  const scaleX = viewportPosition.width / viewportSize[0];
  const scaleY = viewportPosition.height / viewportSize[1];
  const eventPosition =
    //FIXME Are we really calling this with a TouchEvent anywhere?
    'changedTouches' in event
      ? /** @type {TouchEvent} */ (event).changedTouches[0]
      : /** @type {MouseEvent} */ (event);

  return [
    (eventPosition.clientX - viewportPosition.left) / scaleX,
    (eventPosition.clientY - viewportPosition.top) / scaleY,
  ];
}
