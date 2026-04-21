class WebGLPointsLayer extends Layer {
  /**
   * @param {Options<VectorSourceType>} options Options.
   */
  constructor(options) {
    const baseOptions = Object.assign({}, options);

    super(baseOptions);

    /**
     * @private
     * @type {import('../webgl/styleparser.js').StyleParseResult}
     */
    this.parseResult_ = parseLiteralStyle(options.style);

    /**
     * @type {Object<string, (string|number|Array<number>|boolean)>}
     * @private
     */
    this.styleVariables_ = options.style.variables || {};

    /**
     * @private
     * @type {boolean}
     */
    this.hitDetectionDisabled_ = !!options.disableHitDetection;
  }

  createRenderer() {
    const attributes = Object.keys(this.parseResult_.attributes).map(
      (name) => ({
        name,
        ...this.parseResult_.attributes[name],
      })
    );
    return new WebGLPointsLayerRenderer(this, {
      vertexShader: this.parseResult_.builder.getSymbolVertexShader(),
      fragmentShader: this.parseResult_.builder.getSymbolFragmentShader(),
      hitDetectionEnabled: !this.hitDetectionDisabled_,
      uniforms: this.parseResult_.uniforms,
      attributes:
        /** @type {Array<import('../renderer/webgl/PointsLayer.js').CustomAttribute>} */ (
          attributes
        ),
    });
  }

  /**
   * Update any variables used by the layer style and trigger a re-render.
   * @param {Object<string, number>} variables Variables to update.
   */
  updateStyleVariables(variables) {
    Object.assign(this.styleVariables_, variables);
    this.changed();
  }
}
