class MVT extends FeatureFormat {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    super();

    options = options ? options : {};

    /**
     * @type {Projection}
     */
    this.dataProjection = new Projection({
      code: '',
      units: 'tile-pixels',
    });

    /**
     * @private
     * @type {import("../Feature.js").FeatureClass}
     */
    this.featureClass_ = options.featureClass
      ? options.featureClass
      : RenderFeature;

    /**
     * @private
     * @type {string|undefined}
     */
    this.geometryName_ = options.geometryName;

    /**
     * @private
     * @type {string}
     */
    this.layerName_ = options.layerName ? options.layerName : 'layer';

    /**
     * @private
     * @type {Array<string>|null}
     */
    this.layers_ = options.layers ? options.layers : null;

    /**
     * @private
     * @type {string}
     */
    this.idProperty_ = options.idProperty;

    this.supportedMediaTypes = [
      'application/vnd.mapbox-vector-tile',
      'application/x-protobuf',
    ];
  }

  /**
   * Read the raw geometry from the pbf offset stored in a raw feature's geometry
   * property.
   * @param {PBF} pbf PBF.
   * @param {Object} feature Raw feature.
   * @param {Array<number>} flatCoordinates Array to store flat coordinates in.
   * @param {Array<number>} ends Array to store ends in.
   * @private
   */
  readRawGeometry_(pbf, feature, flatCoordinates, ends) {
    pbf.pos = feature.geometry;

    const end = pbf.readVarint() + pbf.pos;
    let cmd = 1;
    let length = 0;
    let x = 0;
    let y = 0;
    let coordsLen = 0;
    let currentEnd = 0;

    while (pbf.pos < end) {
      if (!length) {
        const cmdLen = pbf.readVarint();
        cmd = cmdLen & 0x7;
        length = cmdLen >> 3;
      }

      length--;

      if (cmd === 1 || cmd === 2) {
        x += pbf.readSVarint();
        y += pbf.readSVarint();

        if (cmd === 1) {
          // moveTo
          if (coordsLen > currentEnd) {
            ends.push(coordsLen);
            currentEnd = coordsLen;
          }
        }

        flatCoordinates.push(x, y);
        coordsLen += 2;
      } else if (cmd === 7) {
        if (coordsLen > currentEnd) {
          // close polygon
          flatCoordinates.push(
            flatCoordinates[currentEnd],
            flatCoordinates[currentEnd + 1]
          );
          coordsLen += 2;
        }
      } else {
        throw new Error('Invalid command found in the PBF');
      }
    }

    if (coordsLen > currentEnd) {
      ends.push(coordsLen);
      currentEnd = coordsLen;
    }
  }

  /**
   * @private
   * @param {PBF} pbf PBF
   * @param {Object} rawFeature Raw Mapbox feature.
   * @param {import("./Feature.js").ReadOptions} options Read options.
   * @return {import("../Feature.js").FeatureLike|null} Feature.
   */
  createFeature_(pbf, rawFeature, options) {
    const type = rawFeature.type;
    if (type === 0) {
      return null;
    }

    let feature;
    const values = rawFeature.properties;

    let id;
    if (!this.idProperty_) {
      id = rawFeature.id;
    } else {
      id = values[this.idProperty_];
      delete values[this.idProperty_];
    }

    values[this.layerName_] = rawFeature.layer.name;

    const flatCoordinates = /** @type {Array<number>} */ ([]);
    const ends = /** @type {Array<number>} */ ([]);
    this.readRawGeometry_(pbf, rawFeature, flatCoordinates, ends);

    const geometryType = getGeometryType(type, ends.length);

    if (this.featureClass_ === RenderFeature) {
      feature = new this.featureClass_(
        geometryType,
        flatCoordinates,
        ends,
        values,
        id
      );
      feature.transform(options.dataProjection);
    } else {
      let geom;
      if (geometryType == 'Polygon') {
        const endss = inflateEnds(flatCoordinates, ends);
        geom =
          endss.length > 1
            ? new MultiPolygon(flatCoordinates, 'XY', endss)
            : new Polygon(flatCoordinates, 'XY', ends);
      } else {
        geom =
          geometryType === 'Point'
            ? new Point(flatCoordinates, 'XY')
            : geometryType === 'LineString'
            ? new LineString(flatCoordinates, 'XY')
            : geometryType === 'MultiPoint'
            ? new MultiPoint(flatCoordinates, 'XY')
            : geometryType === 'MultiLineString'
            ? new MultiLineString(flatCoordinates, 'XY', ends)
            : null;
      }
      const ctor = /** @type {typeof import("../Feature.js").default} */ (
        this.featureClass_
      );
      feature = new ctor();
      if (this.geometryName_) {
        feature.setGeometryName(this.geometryName_);
      }
      const geometry = transformGeometryWithOptions(geom, false, options);
      feature.setGeometry(geometry);
      if (id !== undefined) {
        feature.setId(id);
      }
      feature.setProperties(values, true);
    }

    return feature;
  }

  /**
   * @return {import("./Feature.js").Type} Format.
   */
  getType() {
    return 'arraybuffer';
  }

  /**
   * Read all features.
   *
   * @param {ArrayBuffer} source Source.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @return {Array<import("../Feature.js").FeatureLike>} Features.
   * @api
   */
  readFeatures(source, options) {
    const layers = this.layers_;
    options = this.adaptOptions(options);
    const dataProjection = get(options.dataProjection);
    dataProjection.setWorldExtent(options.extent);
    options.dataProjection = dataProjection;

    const pbf = new PBF(/** @type {ArrayBuffer} */ (source));
    const pbfLayers = pbf.readFields(layersPBFReader, {});
    const features = [];
    for (const name in pbfLayers) {
      if (layers && !layers.includes(name)) {
        continue;
      }
      const pbfLayer = pbfLayers[name];

      const extent = pbfLayer ? [0, 0, pbfLayer.extent, pbfLayer.extent] : null;
      dataProjection.setExtent(extent);

      for (let i = 0, ii = pbfLayer.length; i < ii; ++i) {
        const rawFeature = readRawFeature(pbf, pbfLayer, i);
        const feature = this.createFeature_(pbf, rawFeature, options);
        if (feature !== null) {
          features.push(feature);
        }
      }
    }

    return features;
  }

  /**
   * Read the projection from the source.
   *
   * @param {Document|Element|Object|string} source Source.
   * @return {import("../proj/Projection.js").default} Projection.
   * @api
   */
  readProjection(source) {
    return this.dataProjection;
  }

  /**
   * Sets the layers that features will be read from.
   * @param {Array<string>} layers Layers.
   * @api
   */
  setLayers(layers) {
    this.layers_ = layers;
  }
}
