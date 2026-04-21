class WKB extends FeatureFormat {
  /**
   * @param {Options} [options] Optional configuration object.
   */
  constructor(options) {
    super();

    options = options ? options : {};

    this.splitCollection = Boolean(options.splitCollection);

    this.viewCache_ = null;

    this.hex_ = options.hex !== false;
    this.littleEndian_ = options.littleEndian !== false;
    this.ewkb_ = options.ewkb !== false;

    this.layout_ = options.geometryLayout; // null for auto detect
    this.nodataZ_ = options.nodataZ || 0;
    this.nodataM_ = options.nodataM || 0;

    this.srid_ = options.srid;
  }

  /**
   * @return {import("./Feature.js").Type} Format.
   */
  getType() {
    return this.hex_ ? 'text' : 'arraybuffer';
  }

  /**
   * Read a single feature from a source.
   *
   * @param {string|ArrayBuffer|ArrayBufferView} source Source.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @return {import("../Feature.js").default} Feature.
   * @api
   */
  readFeature(source, options) {
    return new Feature({
      geometry: this.readGeometry(source, options),
    });
  }

  /**
   * Read all features from a source.
   *
   * @param {string|ArrayBuffer|ArrayBufferView} source Source.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @return {Array<import("../Feature.js").default>} Features.
   * @api
   */
  readFeatures(source, options) {
    let geometries = [];
    const geometry = this.readGeometry(source, options);
    if (this.splitCollection && geometry instanceof GeometryCollection) {
      geometries = geometry.getGeometriesArray();
    } else {
      geometries = [geometry];
    }
    return geometries.map((geometry) => new Feature({geometry}));
  }

  /**
   * Read a single geometry from a source.
   *
   * @param {string|ArrayBuffer|ArrayBufferView} source Source.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @return {import("../geom/Geometry.js").default} Geometry.
   * @api
   */
  readGeometry(source, options) {
    const view = getDataView(source);
    if (!view) {
      return null;
    }

    const reader = new WkbReader(view);
    const geometry = reader.readGeometry();

    this.viewCache_ = view; // cache for internal subsequent call of readProjection()
    options = this.getReadOptions(source, options);
    this.viewCache_ = null; // release

    return transformGeometryWithOptions(geometry, false, options);
  }

  /**
   * Read the projection from a source.
   *
   * @param {string|ArrayBuffer|ArrayBufferView} source Source.
   * @return {import("../proj/Projection.js").default|undefined} Projection.
   * @api
   */
  readProjection(source) {
    const view = this.viewCache_ || getDataView(source);
    if (!view) {
      return undefined;
    }

    const reader = new WkbReader(view);
    reader.readWkbHeader();

    return (
      (reader.getSrid() && getProjection('EPSG:' + reader.getSrid())) ||
      undefined
    );
  }

  /**
   * Encode a feature in this format.
   *
   * @param {import("../Feature.js").default} feature Feature.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {string|ArrayBuffer} Result.
   * @api
   */
  writeFeature(feature, options) {
    return this.writeGeometry(feature.getGeometry(), options);
  }

  /**
   * Encode an array of features in this format.
   *
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {string|ArrayBuffer} Result.
   * @api
   */
  writeFeatures(features, options) {
    return this.writeGeometry(
      new GeometryCollection(features.map((f) => f.getGeometry())),
      options
    );
  }

  /**
   * Write a single geometry in this format.
   *
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {string|ArrayBuffer} Result.
   * @api
   */
  writeGeometry(geometry, options) {
    options = this.adaptOptions(options);

    const writer = new WkbWriter({
      layout: this.layout_,
      littleEndian: this.littleEndian_,
      ewkb: this.ewkb_,

      nodata: {
        Z: this.nodataZ_,
        M: this.nodataM_,
      },
    });

    // extract SRID from `dataProjection`
    let srid = Number.isInteger(this.srid_) ? Number(this.srid_) : null;
    if (this.srid_ !== false && !Number.isInteger(this.srid_)) {
      const dataProjection =
        options.dataProjection && getProjection(options.dataProjection);
      if (dataProjection) {
        const code = dataProjection.getCode();
        if (code.startsWith('EPSG:')) {
          srid = Number(code.substring(5));
        }
      }
    }

    writer.writeGeometry(
      transformGeometryWithOptions(geometry, true, options),
      srid
    );
    const buffer = writer.getBuffer();

    return this.hex_ ? encodeHexString(buffer) : buffer;
  }
}
