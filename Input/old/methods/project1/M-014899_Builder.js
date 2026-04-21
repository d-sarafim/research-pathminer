appendFlatPointCoordinates(flatCoordinates, stride) {
  const extent = this.getBufferedMaxExtent();
  const tmpCoord = this.tmpCoordinate_;
  const coordinates = this.coordinates;
  let myEnd = coordinates.length;
  for (let i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
    tmpCoord[0] = flatCoordinates[i];
    tmpCoord[1] = flatCoordinates[i + 1];
    if (containsCoordinate(extent, tmpCoord)) {
      coordinates[myEnd++] = tmpCoord[0];
      coordinates[myEnd++] = tmpCoord[1];
    }
  }
  return myEnd;
}
