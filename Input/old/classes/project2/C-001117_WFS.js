class WFS extends XMLFeature {
  /**
   * @param {Options} [options] Optional configuration object.
   */
  constructor(options) {
    super();

    options = options ? options : {};

    /**
     * @private
     * @type {string}
     */
    this.version_ = options.version ? options.version : DEFAULT_VERSION;

    /**
     * @private
     * @type {Array<string>|string|undefined}
     */
    this.featureType_ = options.featureType;

    /**
     * @private
     * @type {Object<string, string>|string|undefined}
     */
    this.featureNS_ = options.featureNS;

    /**
     * @private
     * @type {GMLBase}
     */
    this.gmlFormat_ = options.gmlFormat
      ? options.gmlFormat
      : new GML_FORMATS[this.version_]();

    /**
     * @private
     * @type {string}
     */
    this.schemaLocation_ = options.schemaLocation
      ? options.schemaLocation
      : SCHEMA_LOCATIONS[this.version_];
  }

  /**
   * @return {Array<string>|string|undefined} featureType
   */
  getFeatureType() {
    return this.featureType_;
  }

  /**
   * @param {Array<string>|string|undefined} featureType Feature type(s) to parse.
   */
  setFeatureType(featureType) {
    this.featureType_ = featureType;
  }

  /**
   * @protected
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @return {Array<import("../Feature.js").default>} Features.
   */
  readFeaturesFromNode(node, options) {
    /** @type {import("../xml.js").NodeStackItem} */
    const context = {
      node,
    };
    Object.assign(context, {
      'featureType': this.featureType_,
      'featureNS': this.featureNS_,
    });

    Object.assign(context, this.getReadOptions(node, options ? options : {}));
    const objectStack = [context];
    let featuresNS;
    if (this.version_ === '2.0.0') {
      featuresNS = FEATURE_COLLECTION_PARSERS;
    } else {
      featuresNS = this.gmlFormat_.FEATURE_COLLECTION_PARSERS;
    }
    let features = pushParseAndPop(
      [],
      featuresNS,
      node,
      objectStack,
      this.gmlFormat_
    );
    if (!features) {
      features = [];
    }
    return features;
  }

  /**
   * Read transaction response of the source.
   *
   * @param {Document|Element|Object|string} source Source.
   * @return {TransactionResponse|undefined} Transaction response.
   * @api
   */
  readTransactionResponse(source) {
    if (!source) {
      return undefined;
    }
    if (typeof source === 'string') {
      const doc = parse(source);
      return this.readTransactionResponseFromDocument(doc);
    }
    if (isDocument(source)) {
      return this.readTransactionResponseFromDocument(
        /** @type {Document} */ (source)
      );
    }
    return this.readTransactionResponseFromNode(
      /** @type {Element} */ (source)
    );
  }

  /**
   * Read feature collection metadata of the source.
   *
   * @param {Document|Element|Object|string} source Source.
   * @return {FeatureCollectionMetadata|undefined}
   *     FeatureCollection metadata.
   * @api
   */
  readFeatureCollectionMetadata(source) {
    if (!source) {
      return undefined;
    }
    if (typeof source === 'string') {
      const doc = parse(source);
      return this.readFeatureCollectionMetadataFromDocument(doc);
    }
    if (isDocument(source)) {
      return this.readFeatureCollectionMetadataFromDocument(
        /** @type {Document} */ (source)
      );
    }
    return this.readFeatureCollectionMetadataFromNode(
      /** @type {Element} */ (source)
    );
  }

  /**
   * @param {Document} doc Document.
   * @return {FeatureCollectionMetadata|undefined}
   *     FeatureCollection metadata.
   */
  readFeatureCollectionMetadataFromDocument(doc) {
    for (let n = /** @type {Node} */ (doc.firstChild); n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        return this.readFeatureCollectionMetadataFromNode(
          /** @type {Element} */ (n)
        );
      }
    }
    return undefined;
  }

  /**
   * @param {Element} node Node.
   * @return {FeatureCollectionMetadata|undefined}
   *     FeatureCollection metadata.
   */
  readFeatureCollectionMetadataFromNode(node) {
    const result = {};
    const value = readNonNegativeIntegerString(
      node.getAttribute('numberOfFeatures')
    );
    result['numberOfFeatures'] = value;
    return pushParseAndPop(
      /** @type {FeatureCollectionMetadata} */ (result),
      FEATURE_COLLECTION_PARSERS,
      node,
      [],
      this.gmlFormat_
    );
  }

  /**
   * @param {Document} doc Document.
   * @return {TransactionResponse|undefined} Transaction response.
   */
  readTransactionResponseFromDocument(doc) {
    for (let n = /** @type {Node} */ (doc.firstChild); n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        return this.readTransactionResponseFromNode(/** @type {Element} */ (n));
      }
    }
    return undefined;
  }

  /**
   * @param {Element} node Node.
   * @return {TransactionResponse|undefined} Transaction response.
   */
  readTransactionResponseFromNode(node) {
    return pushParseAndPop(
      /** @type {TransactionResponse} */ ({}),
      TRANSACTION_RESPONSE_PARSERS,
      node,
      []
    );
  }

  /**
   * Encode format as WFS `GetFeature` and return the Node.
   *
   * @param {WriteGetFeatureOptions} options Options.
   * @return {Node} Result.
   * @api
   */
  writeGetFeature(options) {
    const node = createElementNS(WFSNS[this.version_], 'GetFeature');
    node.setAttribute('service', 'WFS');
    node.setAttribute('version', this.version_);
    if (options.handle) {
      node.setAttribute('handle', options.handle);
    }
    if (options.outputFormat) {
      node.setAttribute('outputFormat', options.outputFormat);
    }
    if (options.maxFeatures !== undefined) {
      node.setAttribute('maxFeatures', String(options.maxFeatures));
    }
    if (options.resultType) {
      node.setAttribute('resultType', options.resultType);
    }
    if (options.startIndex !== undefined) {
      node.setAttribute('startIndex', String(options.startIndex));
    }
    if (options.count !== undefined) {
      node.setAttribute('count', String(options.count));
    }
    if (options.viewParams !== undefined) {
      node.setAttribute('viewParams', options.viewParams);
    }
    node.setAttributeNS(
      XML_SCHEMA_INSTANCE_URI,
      'xsi:schemaLocation',
      this.schemaLocation_
    );
    /** @type {import("../xml.js").NodeStackItem} */
    const context = {
      node,
    };
    Object.assign(context, {
      'version': this.version_,
      'srsName': options.srsName,
      'featureNS': options.featureNS ? options.featureNS : this.featureNS_,
      'featurePrefix': options.featurePrefix,
      'propertyNames': options.propertyNames ? options.propertyNames : [],
    });
    assert(
      Array.isArray(options.featureTypes),
      '`options.featureTypes` must be an Array'
    );
    if (typeof options.featureTypes[0] === 'string') {
      let filter = options.filter;
      if (options.bbox) {
        assert(
          options.geometryName,
          '`options.geometryName` must also be provided when `options.bbox` is set'
        );
        filter = this.combineBboxAndFilter(
          options.geometryName,
          options.bbox,
          options.srsName,
          filter
        );
      }
      Object.assign(context, {
        'geometryName': options.geometryName,
        'filter': filter,
      });
      writeGetFeature(
        node,
        /** @type {!Array<string>} */ (options.featureTypes),
        [context]
      );
    } else {
      // Write one query node per element in featuresType.
      options.featureTypes.forEach((/** @type {FeatureType} */ featureType) => {
        const completeFilter = this.combineBboxAndFilter(
          featureType.geometryName,
          featureType.bbox,
          options.srsName,
          options.filter
        );
        Object.assign(context, {
          'geometryName': featureType.geometryName,
          'filter': completeFilter,
        });
        writeGetFeature(node, [featureType.name], [context]);
      });
    }
    return node;
  }

  /**
   * Create a bbox filter and combine it with another optional filter.
   *
   * @param {!string} geometryName Geometry name to use.
   * @param {!import("../extent.js").Extent} extent Extent.
   * @param {string} [srsName] SRS name. No srsName attribute will be
   *    set on geometries when this is not provided.
   * @param {import("./filter/Filter.js").default} [filter] Filter condition.
   * @return {import("./filter/Filter.js").default} The filter.
   */
  combineBboxAndFilter(geometryName, extent, srsName, filter) {
    const bboxFilter = bboxFilterFn(geometryName, extent, srsName);
    if (filter) {
      // if bbox and filter are both set, combine the two into a single filter
      return andFilterFn(filter, bboxFilter);
    }
    return bboxFilter;
  }

  /**
   * Encode format as WFS `Transaction` and return the Node.
   *
   * @param {Array<import("../Feature.js").default>} inserts The features to insert.
   * @param {Array<import("../Feature.js").default>} updates The features to update.
   * @param {Array<import("../Feature.js").default>} deletes The features to delete.
   * @param {WriteTransactionOptions} options Write options.
   * @return {Node} Result.
   * @api
   */
  writeTransaction(inserts, updates, deletes, options) {
    const objectStack = [];
    const version = options.version ? options.version : this.version_;
    const node = createElementNS(WFSNS[version], 'Transaction');

    node.setAttribute('service', 'WFS');
    node.setAttribute('version', version);
    let baseObj;
    /** @type {import("../xml.js").NodeStackItem} */
    if (options) {
      baseObj = options.gmlOptions ? options.gmlOptions : {};
      if (options.handle) {
        node.setAttribute('handle', options.handle);
      }
    }
    node.setAttributeNS(
      XML_SCHEMA_INSTANCE_URI,
      'xsi:schemaLocation',
      SCHEMA_LOCATIONS[version]
    );

    const request = createTransactionRequest(node, baseObj, version, options);
    if (inserts) {
      serializeTransactionRequest('Insert', inserts, objectStack, request);
    }
    if (updates) {
      serializeTransactionRequest('Update', updates, objectStack, request);
    }
    if (deletes) {
      serializeTransactionRequest('Delete', deletes, objectStack, request);
    }
    if (options.nativeElements) {
      serializeTransactionRequest(
        'Native',
        options.nativeElements,
        objectStack,
        request
      );
    }
    return node;
  }

  /**
   * @param {Document} doc Document.
   * @return {import("../proj/Projection.js").default} Projection.
   */
  readProjectionFromDocument(doc) {
    for (let n = doc.firstChild; n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        return this.readProjectionFromNode(/** @type {Element} */ (n));
      }
    }
    return null;
  }

  /**
   * @param {Element} node Node.
   * @return {import("../proj/Projection.js").default} Projection.
   */
  readProjectionFromNode(node) {
    if (node.firstElementChild && node.firstElementChild.firstElementChild) {
      node = node.firstElementChild.firstElementChild;
      for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
        if (
          !(
            n.childNodes.length === 0 ||
            (n.childNodes.length === 1 && n.firstChild.nodeType === 3)
          )
        ) {
          const objectStack = [{}];
          this.gmlFormat_.readGeometryElement(n, objectStack);
          return getProjection(objectStack.pop().srsName);
        }
      }
    }

    return null;
  }
}
