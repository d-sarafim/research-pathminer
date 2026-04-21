drawCircle(geometry) {
  if (this.squaredTolerance_) {
    geometry = /** @type {import("../../geom/Circle.js").default} */ (
      geometry.simplifyTransformed(
        this.squaredTolerance_,
        this.userTransform_
      )
    );
  }
  if (!intersects(this.extent_, geometry.getExtent())) {
    return;
  }
  if (this.fillState_ || this.strokeState_) {
    if (this.fillState_) {
      this.setContextFillState_(this.fillState_);
    }
    if (this.strokeState_) {
      this.setContextStrokeState_(this.strokeState_);
    }
    const pixelCoordinates = transformGeom2D(
      geometry,
      this.transform_,
      this.pixelCoordinates_
    );
    const dx = pixelCoordinates[2] - pixelCoordinates[0];
    const dy = pixelCoordinates[3] - pixelCoordinates[1];
    const radius = Math.sqrt(dx * dx + dy * dy);
    const context = this.context_;
    context.beginPath();
    context.arc(
      pixelCoordinates[0],
      pixelCoordinates[1],
      radius,
      0,
      2 * Math.PI
    );
    if (this.fillState_) {
      context.fill();
    }
    if (this.strokeState_) {
      context.stroke();
    }
  }
  if (this.text_ !== '') {
    this.drawText_(geometry.getCenter(), 0, 2, 2);
  }
}
