class VectorImageLayer extends BaseVectorLayer {
  /**
   * @param {Options<VectorSourceType>} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    const baseOptions = Object.assign({}, options);
    delete baseOptions.imageRatio;
    super(baseOptions);

    /**
     * @type {number}
     * @private
     */
    this.imageRatio_ =
      options.imageRatio !== undefined ? options.imageRatio : 1;
  }

  /**
   * @return {number} Ratio between rendered extent size and viewport extent size.
   */
  getImageRatio() {
    return this.imageRatio_;
  }

  createRenderer() {
    return new CanvasVectorImageLayerRenderer(this);
  }
}
