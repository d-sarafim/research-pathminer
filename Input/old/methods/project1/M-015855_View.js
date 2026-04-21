getZoomForResolution(resolution) {
  let offset = this.minZoom_ || 0;
  let max, zoomFactor;
  if (this.resolutions_) {
    const nearest = linearFindNearest(this.resolutions_, resolution, 1);
    offset = nearest;
    max = this.resolutions_[nearest];
    if (nearest == this.resolutions_.length - 1) {
      zoomFactor = 2;
    } else {
      zoomFactor = max / this.resolutions_[nearest + 1];
    }
  } else {
    max = this.maxResolution_;
    zoomFactor = this.zoomFactor_;
  }
  return offset + Math.log(max / resolution) / Math.log(zoomFactor);
}
