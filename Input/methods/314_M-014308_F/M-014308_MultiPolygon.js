clone() {
  const len = this.endss_.length;
  const newEndss = new Array(len);
  for (let i = 0; i < len; ++i) {
    newEndss[i] = this.endss_[i].slice();
  }

  const multiPolygon = new MultiPolygon(
    this.flatCoordinates.slice(),
    this.layout,
    newEndss
  );
  multiPolygon.applyProperties(this);

  return multiPolygon;
}
