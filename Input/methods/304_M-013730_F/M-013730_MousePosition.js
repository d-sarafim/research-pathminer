handleMouseMove(event) {
  const map = this.getMap();
  this.updateHTML_(map.getEventPixel(event));
}
