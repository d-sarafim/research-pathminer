class WMTS extends TileImage {
  /**
   * @param {Options} options WMTS options.
   */
  constructor(options) {
    // TODO: add support for TileMatrixLimits

    const requestEncoding =
      options.requestEncoding !== undefined ? options.requestEncoding : 'KVP';

    // FIXME: should we create a default tileGrid?
    // we could issue a getCapabilities xhr to retrieve missing configuration
    const tileGrid = options.tileGrid;

    let urls = options.urls;
    if (urls === undefined && options.url !== undefined) {
      urls = expandUrl(options.url);
    }

    super({
      attributions: options.attributions,
      attributionsCollapsible: options.attributionsCollapsible,
      cacheSize: options.cacheSize,
      crossOrigin: options.crossOrigin,
      interpolate: options.interpolate,
      projection: options.projection,
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      tileClass: options.tileClass,
      tileGrid: tileGrid,
      tileLoadFunction: options.tileLoadFunction,
      tilePixelRatio: options.tilePixelRatio,
      urls: urls,
      wrapX: options.wrapX !== undefined ? options.wrapX : false,
      transition: options.transition,
      zDirection: options.zDirection,
    });

    /**
     * @private
     * @type {string}
     */
    this.version_ = options.version !== undefined ? options.version : '1.0.0';

    /**
     * @private
     * @type {string}
     */
    this.format_ = options.format !== undefined ? options.format : 'image/jpeg';

    /**
     * @private
     * @type {!Object}
     */
    this.dimensions_ =
      options.dimensions !== undefined ? options.dimensions : {};

    /**
     * @private
     * @type {string}
     */
    this.layer_ = options.layer;

    /**
     * @private
     * @type {string}
     */
    this.matrixSet_ = options.matrixSet;

    /**
     * @private
     * @type {string}
     */
    this.style_ = options.style;

    // FIXME: should we guess this requestEncoding from options.url(s)
    //        structure? that would mean KVP only if a template is not provided.

    /**
     * @private
     * @type {RequestEncoding}
     */
    this.requestEncoding_ = requestEncoding;

    this.setKey(this.getKeyForDimensions_());

    if (urls && urls.length > 0) {
      this.tileUrlFunction = createFromTileUrlFunctions(
        urls.map(this.createFromWMTSTemplate.bind(this))
      );
    }
  }

  /**
   * Set the URLs to use for requests.
   * URLs may contain OGC conform URL Template Variables: {TileMatrix}, {TileRow}, {TileCol}.
   * @param {Array<string>} urls URLs.
   */
  setUrls(urls) {
    this.urls = urls;
    const key = urls.join('\n');
    this.setTileUrlFunction(
      createFromTileUrlFunctions(
        urls.map(this.createFromWMTSTemplate.bind(this))
      ),
      key
    );
  }

  /**
   * Get the dimensions, i.e. those passed to the constructor through the
   * "dimensions" option, and possibly updated using the updateDimensions
   * method.
   * @return {!Object} Dimensions.
   * @api
   */
  getDimensions() {
    return this.dimensions_;
  }

  /**
   * Return the image format of the WMTS source.
   * @return {string} Format.
   * @api
   */
  getFormat() {
    return this.format_;
  }

  /**
   * Return the layer of the WMTS source.
   * @return {string} Layer.
   * @api
   */
  getLayer() {
    return this.layer_;
  }

  /**
   * Return the matrix set of the WMTS source.
   * @return {string} MatrixSet.
   * @api
   */
  getMatrixSet() {
    return this.matrixSet_;
  }

  /**
   * Return the request encoding, either "KVP" or "REST".
   * @return {RequestEncoding} Request encoding.
   * @api
   */
  getRequestEncoding() {
    return this.requestEncoding_;
  }

  /**
   * Return the style of the WMTS source.
   * @return {string} Style.
   * @api
   */
  getStyle() {
    return this.style_;
  }

  /**
   * Return the version of the WMTS source.
   * @return {string} Version.
   * @api
   */
  getVersion() {
    return this.version_;
  }

  /**
   * @private
   * @return {string} The key for the current dimensions.
   */
  getKeyForDimensions_() {
    const res = this.urls ? this.urls.slice(0) : [];
    for (const key in this.dimensions_) {
      res.push(key + '-' + this.dimensions_[key]);
    }
    return res.join('/');
  }

  /**
   * Update the dimensions.
   * @param {Object} dimensions Dimensions.
   * @api
   */
  updateDimensions(dimensions) {
    Object.assign(this.dimensions_, dimensions);
    this.setKey(this.getKeyForDimensions_());
  }

  /**
   * @param {string} template Template.
   * @return {import("../Tile.js").UrlFunction} Tile URL function.
   */
  createFromWMTSTemplate(template) {
    const requestEncoding = this.requestEncoding_;

    // context property names are lower case to allow for a case insensitive
    // replacement as some services use different naming conventions
    const context = {
      'layer': this.layer_,
      'style': this.style_,
      'tilematrixset': this.matrixSet_,
    };

    if (requestEncoding == 'KVP') {
      Object.assign(context, {
        'Service': 'WMTS',
        'Request': 'GetTile',
        'Version': this.version_,
        'Format': this.format_,
      });
    }

    // TODO: we may want to create our own appendParams function so that params
    // order conforms to wmts spec guidance, and so that we can avoid to escape
    // special template params

    template =
      requestEncoding == 'KVP'
        ? appendParams(template, context)
        : template.replace(/\{(\w+?)\}/g, function (m, p) {
            return p.toLowerCase() in context ? context[p.toLowerCase()] : m;
          });

    const tileGrid = /** @type {import("../tilegrid/WMTS.js").default} */ (
      this.tileGrid
    );
    const dimensions = this.dimensions_;

    return (
      /**
       * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
       * @param {number} pixelRatio Pixel ratio.
       * @param {import("../proj/Projection.js").default} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function (tileCoord, pixelRatio, projection) {
        if (!tileCoord) {
          return undefined;
        }
        const localContext = {
          'TileMatrix': tileGrid.getMatrixId(tileCoord[0]),
          'TileCol': tileCoord[1],
          'TileRow': tileCoord[2],
        };
        Object.assign(localContext, dimensions);
        let url = template;
        if (requestEncoding == 'KVP') {
          url = appendParams(url, localContext);
        } else {
          url = url.replace(/\{(\w+?)\}/g, function (m, p) {
            return localContext[p];
          });
        }
        return url;
      }
    );
  }
}
