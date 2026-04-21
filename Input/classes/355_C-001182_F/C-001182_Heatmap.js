class Heatmap extends BaseVector {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    const baseOptions = Object.assign({}, options);

    delete baseOptions.gradient;
    delete baseOptions.radius;
    delete baseOptions.blur;
    delete baseOptions.weight;
    super(baseOptions);

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.gradient_ = null;

    this.addChangeListener(Property.GRADIENT, this.handleGradientChanged_);

    this.setGradient(options.gradient ? options.gradient : DEFAULT_GRADIENT);

    this.setBlur(options.blur !== undefined ? options.blur : 15);

    this.setRadius(options.radius !== undefined ? options.radius : 8);

    const weight = options.weight ? options.weight : 'weight';
    if (typeof weight === 'string') {
      this.weightFunction_ = function (feature) {
        return feature.get(weight);
      };
    } else {
      this.weightFunction_ = weight;
    }

    // For performance reasons, don't sort the features before rendering.
    // The render order is not relevant for a heatmap representation.
    this.setRenderOrder(null);
  }

  /**
   * Return the blur size in pixels.
   * @return {number} Blur size in pixels.
   * @api
   * @observable
   */
  getBlur() {
    return /** @type {number} */ (this.get(Property.BLUR));
  }

  /**
   * Return the gradient colors as array of strings.
   * @return {Array<string>} Colors.
   * @api
   * @observable
   */
  getGradient() {
    return /** @type {Array<string>} */ (this.get(Property.GRADIENT));
  }

  /**
   * Return the size of the radius in pixels.
   * @return {number} Radius size in pixel.
   * @api
   * @observable
   */
  getRadius() {
    return /** @type {number} */ (this.get(Property.RADIUS));
  }

  /**
   * @private
   */
  handleGradientChanged_() {
    this.gradient_ = createGradient(this.getGradient());
  }

  /**
   * Set the blur size in pixels.
   * @param {number} blur Blur size in pixels.
   * @api
   * @observable
   */
  setBlur(blur) {
    this.set(Property.BLUR, blur);
  }

  /**
   * Set the gradient colors as array of strings.
   * @param {Array<string>} colors Gradient.
   * @api
   * @observable
   */
  setGradient(colors) {
    this.set(Property.GRADIENT, colors);
  }

  /**
   * Set the size of the radius in pixels.
   * @param {number} radius Radius size in pixel.
   * @api
   * @observable
   */
  setRadius(radius) {
    this.set(Property.RADIUS, radius);
  }

  createRenderer() {
    const builder = new ShaderBuilder()
      .addAttribute('float a_weight')
      .addVarying('v_weight', 'float', 'a_weight')
      .addUniform('float u_size')
      .addUniform('float u_blurSlope')
      .setSymbolSizeExpression('vec2(u_size)')
      .setSymbolColorExpression(
        'vec4(smoothstep(0., 1., (1. - length(coordsPx * 2. / v_quadSizePx)) * u_blurSlope) * v_weight)'
      );

    return new WebGLPointsLayerRenderer(this, {
      className: this.getClassName(),
      attributes: [
        {
          name: 'weight',
          callback: (feature) => {
            const weight = this.weightFunction_(feature);
            return weight !== undefined ? clamp(weight, 0, 1) : 1;
          },
        },
      ],
      uniforms: {
        u_size: () => {
          return (this.get(Property.RADIUS) + this.get(Property.BLUR)) * 2;
        },
        u_blurSlope: () => {
          return (
            this.get(Property.RADIUS) / Math.max(1, this.get(Property.BLUR))
          );
        },
      },
      hitDetectionEnabled: true,
      vertexShader: builder.getSymbolVertexShader(),
      fragmentShader: builder.getSymbolFragmentShader(),
      postProcesses: [
        {
          fragmentShader: `
            precision mediump float;

            uniform sampler2D u_image;
            uniform sampler2D u_gradientTexture;
            uniform float u_opacity;

            varying vec2 v_texCoord;

            void main() {
              vec4 color = texture2D(u_image, v_texCoord);
              gl_FragColor.a = color.a * u_opacity;
              gl_FragColor.rgb = texture2D(u_gradientTexture, vec2(0.5, color.a)).rgb;
              gl_FragColor.rgb *= gl_FragColor.a;
            }`,
          uniforms: {
            u_gradientTexture: () => this.gradient_,
            u_opacity: () => this.getOpacity(),
          },
        },
      ],
    });
  }

  renderDeclutter() {}
}
