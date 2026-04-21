class GPX extends XMLFeature {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    super();

    options = options ? options : {};

    /**
     * @type {import("../proj/Projection.js").default}
     */
    this.dataProjection = getProjection('EPSG:4326');

    /**
     * @type {function(Feature, Node): void|undefined}
     * @private
     */
    this.readExtensions_ = options.readExtensions;
  }

  /**
   * @param {Array<Feature>} features List of features.
   * @private
   */
  handleReadExtensions_(features) {
    if (!features) {
      features = [];
    }
    for (let i = 0, ii = features.length; i < ii; ++i) {
      const feature = features[i];
      if (this.readExtensions_) {
        const extensionsNode = feature.get('extensionsNode_') || null;
        this.readExtensions_(feature, extensionsNode);
      }
      feature.set('extensionsNode_', undefined);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @return {import("../Feature.js").default} Feature.
   */
  readFeatureFromNode(node, options) {
    if (!NAMESPACE_URIS.includes(node.namespaceURI)) {
      return null;
    }
    const featureReader = FEATURE_READER[node.localName];
    if (!featureReader) {
      return null;
    }
    const feature = featureReader(node, [this.getReadOptions(node, options)]);
    if (!feature) {
      return null;
    }
    this.handleReadExtensions_([feature]);
    return feature;
  }

  /**
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @return {Array<import("../Feature.js").default>} Features.
   */
  readFeaturesFromNode(node, options) {
    if (!NAMESPACE_URIS.includes(node.namespaceURI)) {
      return [];
    }
    if (node.localName == 'gpx') {
      /** @type {Array<Feature>} */
      const features = pushParseAndPop([], GPX_PARSERS, node, [
        this.getReadOptions(node, options),
      ]);
      if (features) {
        this.handleReadExtensions_(features);
        return features;
      }
      return [];
    }
    return [];
  }

  /**
   * Encode an array of features in the GPX format as an XML node.
   * LineString geometries are output as routes (`<rte>`), and MultiLineString
   * as tracks (`<trk>`).
   *
   * @param {Array<Feature>} features Features.
   * @param {import("./Feature.js").WriteOptions} [options] Options.
   * @return {Node} Node.
   * @api
   */
  writeFeaturesNode(features, options) {
    options = this.adaptOptions(options);
    //FIXME Serialize metadata
    const gpx = createElementNS('http://www.topografix.com/GPX/1/1', 'gpx');
    const xmlnsUri = 'http://www.w3.org/2000/xmlns/';
    gpx.setAttributeNS(xmlnsUri, 'xmlns:xsi', XML_SCHEMA_INSTANCE_URI);
    gpx.setAttributeNS(
      XML_SCHEMA_INSTANCE_URI,
      'xsi:schemaLocation',
      SCHEMA_LOCATION
    );
    gpx.setAttribute('version', '1.1');
    gpx.setAttribute('creator', 'OpenLayers');

    pushSerializeAndPop(
      /** @type {import("../xml.js").NodeStackItem} */
      ({node: gpx}),
      GPX_SERIALIZERS,
      GPX_NODE_FACTORY,
      features,
      [options]
    );
    return gpx;
  }
}
