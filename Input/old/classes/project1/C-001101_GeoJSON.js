class GeoJSON extends JSONFeature {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    super();

    /**
     * @type {import("../proj/Projection.js").default}
     */
    this.dataProjection = getProjection(
      options.dataProjection ? options.dataProjection : 'EPSG:4326'
    );

    if (options.featureProjection) {
      /**
       * @type {import("../proj/Projection.js").default}
       */
      this.defaultFeatureProjection = getProjection(options.featureProjection);
    }

    /**
     * Name of the geometry attribute for features.
     * @type {string|undefined}
     * @private
     */
    this.geometryName_ = options.geometryName;

    /**
     * Look for the geometry name in the feature GeoJSON
     * @type {boolean|undefined}
     * @private
     */
    this.extractGeometryName_ = options.extractGeometryName;

    this.supportedMediaTypes = [
      'application/geo+json',
      'application/vnd.geo+json',
    ];
  }

  /**
   * @param {Object} object Object.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {import("../Feature.js").default} Feature.
   */
  readFeatureFromObject(object, options) {
    /**
     * @type {GeoJSONFeature}
     */
    let geoJSONFeature = null;
    if (object['type'] === 'Feature') {
      geoJSONFeature = /** @type {GeoJSONFeature} */ (object);
    } else {
      geoJSONFeature = {
        'type': 'Feature',
        'geometry': /** @type {GeoJSONGeometry} */ (object),
        'properties': null,
      };
    }

    const geometry = readGeometry(geoJSONFeature['geometry'], options);
    const feature = new Feature();
    if (this.geometryName_) {
      feature.setGeometryName(this.geometryName_);
    } else if (
      this.extractGeometryName_ &&
      'geometry_name' in geoJSONFeature !== undefined
    ) {
      feature.setGeometryName(geoJSONFeature['geometry_name']);
    }
    feature.setGeometry(geometry);

    if ('id' in geoJSONFeature) {
      feature.setId(geoJSONFeature['id']);
    }

    if (geoJSONFeature['properties']) {
      feature.setProperties(geoJSONFeature['properties'], true);
    }
    return feature;
  }

  /**
   * @param {Object} object Object.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {Array<Feature>} Features.
   */
  readFeaturesFromObject(object, options) {
    const geoJSONObject = /** @type {GeoJSONObject} */ (object);
    /** @type {Array<import("../Feature.js").default>} */
    let features = null;
    if (geoJSONObject['type'] === 'FeatureCollection') {
      const geoJSONFeatureCollection = /** @type {GeoJSONFeatureCollection} */ (
        object
      );
      features = [];
      const geoJSONFeatures = geoJSONFeatureCollection['features'];
      for (let i = 0, ii = geoJSONFeatures.length; i < ii; ++i) {
        features.push(this.readFeatureFromObject(geoJSONFeatures[i], options));
      }
    } else {
      features = [this.readFeatureFromObject(object, options)];
    }
    return features;
  }

  /**
   * @param {GeoJSONGeometry} object Object.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {import("../geom/Geometry.js").default} Geometry.
   */
  readGeometryFromObject(object, options) {
    return readGeometry(object, options);
  }

  /**
   * @param {Object} object Object.
   * @protected
   * @return {import("../proj/Projection.js").default} Projection.
   */
  readProjectionFromObject(object) {
    const crs = object['crs'];
    let projection;
    if (crs) {
      if (crs['type'] == 'name') {
        projection = getProjection(crs['properties']['name']);
      } else if (crs['type'] === 'EPSG') {
        projection = getProjection('EPSG:' + crs['properties']['code']);
      } else {
        throw new Error('Unknown SRS type');
      }
    } else {
      projection = this.dataProjection;
    }
    return /** @type {import("../proj/Projection.js").default} */ (projection);
  }

  /**
   * Encode a feature as a GeoJSON Feature object.
   *
   * @param {import("../Feature.js").default} feature Feature.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {GeoJSONFeature} Object.
   * @api
   */
  writeFeatureObject(feature, options) {
    options = this.adaptOptions(options);

    /** @type {GeoJSONFeature} */
    const object = {
      'type': 'Feature',
      geometry: null,
      properties: null,
    };

    const id = feature.getId();
    if (id !== undefined) {
      object.id = id;
    }

    if (!feature.hasProperties()) {
      return object;
    }

    const properties = feature.getProperties();
    const geometry = feature.getGeometry();
    if (geometry) {
      object.geometry = writeGeometry(geometry, options);

      delete properties[feature.getGeometryName()];
    }

    if (!isEmpty(properties)) {
      object.properties = properties;
    }

    return object;
  }

  /**
   * Encode an array of features as a GeoJSON object.
   *
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {GeoJSONFeatureCollection} GeoJSON Object.
   * @api
   */
  writeFeaturesObject(features, options) {
    options = this.adaptOptions(options);
    const objects = [];
    for (let i = 0, ii = features.length; i < ii; ++i) {
      objects.push(this.writeFeatureObject(features[i], options));
    }
    return {
      type: 'FeatureCollection',
      features: objects,
    };
  }

  /**
   * Encode a geometry as a GeoJSON object.
   *
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {GeoJSONGeometry|GeoJSONGeometryCollection} Object.
   * @api
   */
  writeGeometryObject(geometry, options) {
    return writeGeometry(geometry, this.adaptOptions(options));
  }
}
