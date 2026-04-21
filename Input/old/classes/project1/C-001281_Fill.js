class Fill {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options || {};

    /**
     * @private
     * @type {import("../color.js").Color|import("../colorlike.js").ColorLike|null}
     */
    this.color_ = options.color !== undefined ? options.color : null;
  }

  /**
   * Clones the style. The color is not cloned if it is an {@link module:ol/colorlike~ColorLike}.
   * @return {Fill} The cloned style.
   * @api
   */
  clone() {
    const color = this.getColor();
    return new Fill({
      color: Array.isArray(color) ? color.slice() : color || undefined,
    });
  }

  /**
   * Get the fill color.
   * @return {import("../color.js").Color|import("../colorlike.js").ColorLike|null} Color.
   * @api
   */
  getColor() {
    return this.color_;
  }

  /**
   * Set the color.
   *
   * @param {import("../color.js").Color|import("../colorlike.js").ColorLike|null} color Color.
   * @api
   */
  setColor(color) {
    this.color_ = color;
  }
}
