constructor(layer) {
  super(layer);

  /** @private */
  this.boundHandleStyleImageChange_ = this.handleStyleImageChange_.bind(this);

  /**
   * @private
   * @type {number}
   */
  this.renderedLayerRevision_;

  /**
   * @private
   * @type {import("../../transform").Transform}
   */
  this.renderedPixelToCoordinateTransform_ = null;

  /**
   * @private
   * @type {number}
   */
  this.renderedRotation_;

  /**
   * @private
   * @type {import("../../transform.js").Transform}
   */
  this.tmpTransform_ = createTransform();
}
