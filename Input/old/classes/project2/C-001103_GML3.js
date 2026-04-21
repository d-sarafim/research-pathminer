class GML3 extends GMLBase {
  /**
   * @param {import("./GMLBase.js").Options} [options] Optional configuration object.
   */
  constructor(options) {
    options = options ? options : {};

    super(options);

    /**
     * @private
     * @type {boolean}
     */
    this.surface_ = options.surface !== undefined ? options.surface : false;

    /**
     * @private
     * @type {boolean}
     */
    this.curve_ = options.curve !== undefined ? options.curve : false;

    /**
     * @private
     * @type {boolean}
     */
    this.multiCurve_ =
      options.multiCurve !== undefined ? options.multiCurve : true;

    /**
     * @private
     * @type {boolean}
     */
    this.multiSurface_ =
      options.multiSurface !== undefined ? options.multiSurface : true;

    /**
     * @type {string}
     */
    this.schemaLocation = options.schemaLocation
      ? options.schemaLocation
      : schemaLocation;

    /**
     * @private
     * @type {boolean}
     */
    this.hasZ = options.hasZ !== undefined ? options.hasZ : false;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {MultiLineString|undefined} MultiLineString.
   */
  readMultiCurve(node, objectStack) {
    /** @type {Array<LineString>} */
    const lineStrings = pushParseAndPop(
      [],
      this.MULTICURVE_PARSERS,
      node,
      objectStack,
      this
    );
    if (lineStrings) {
      const multiLineString = new MultiLineString(lineStrings);
      return multiLineString;
    }
    return undefined;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<number>|undefined} Polygon.
   */
  readFlatCurveRing(node, objectStack) {
    /** @type {Array<LineString>} */
    const lineStrings = pushParseAndPop(
      [],
      this.MULTICURVE_PARSERS,
      node,
      objectStack,
      this
    );
    const flatCoordinates = [];
    for (let i = 0, ii = lineStrings.length; i < ii; ++i) {
      extend(flatCoordinates, lineStrings[i].getFlatCoordinates());
    }
    return flatCoordinates;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {MultiPolygon|undefined} MultiPolygon.
   */
  readMultiSurface(node, objectStack) {
    /** @type {Array<Polygon>} */
    const polygons = pushParseAndPop(
      [],
      this.MULTISURFACE_PARSERS,
      node,
      objectStack,
      this
    );
    if (polygons) {
      return new MultiPolygon(polygons);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   */
  curveMemberParser(node, objectStack) {
    parseNode(this.CURVEMEMBER_PARSERS, node, objectStack, this);
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   */
  surfaceMemberParser(node, objectStack) {
    parseNode(this.SURFACEMEMBER_PARSERS, node, objectStack, this);
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<(Array<number>)>|undefined} flat coordinates.
   */
  readPatch(node, objectStack) {
    return pushParseAndPop(
      [null],
      this.PATCHES_PARSERS,
      node,
      objectStack,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<number>|undefined} flat coordinates.
   */
  readSegment(node, objectStack) {
    return pushParseAndPop([], this.SEGMENTS_PARSERS, node, objectStack, this);
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<(Array<number>)>|undefined} flat coordinates.
   */
  readPolygonPatch(node, objectStack) {
    return pushParseAndPop(
      [null],
      this.FLAT_LINEAR_RINGS_PARSERS,
      node,
      objectStack,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<number>|undefined} flat coordinates.
   */
  readLineStringSegment(node, objectStack) {
    return pushParseAndPop(
      [null],
      this.GEOMETRY_FLAT_COORDINATES_PARSERS,
      node,
      objectStack,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   */
  interiorParser(node, objectStack) {
    /** @type {Array<number>|undefined} */
    const flatLinearRing = pushParseAndPop(
      undefined,
      this.RING_PARSERS,
      node,
      objectStack,
      this
    );
    if (flatLinearRing) {
      const flatLinearRings =
        /** @type {Array<Array<number>>} */
        (objectStack[objectStack.length - 1]);
      flatLinearRings.push(flatLinearRing);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   */
  exteriorParser(node, objectStack) {
    /** @type {Array<number>|undefined} */
    const flatLinearRing = pushParseAndPop(
      undefined,
      this.RING_PARSERS,
      node,
      objectStack,
      this
    );
    if (flatLinearRing) {
      const flatLinearRings =
        /** @type {Array<Array<number>>} */
        (objectStack[objectStack.length - 1]);
      flatLinearRings[0] = flatLinearRing;
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Polygon|undefined} Polygon.
   */
  readSurface(node, objectStack) {
    /** @type {Array<Array<number>>} */
    const flatLinearRings = pushParseAndPop(
      [null],
      this.SURFACE_PARSERS,
      node,
      objectStack,
      this
    );
    if (flatLinearRings && flatLinearRings[0]) {
      const flatCoordinates = flatLinearRings[0];
      const ends = [flatCoordinates.length];
      let i, ii;
      for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
        extend(flatCoordinates, flatLinearRings[i]);
        ends.push(flatCoordinates.length);
      }
      return new Polygon(flatCoordinates, 'XYZ', ends);
    }
    return undefined;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {LineString|undefined} LineString.
   */
  readCurve(node, objectStack) {
    /** @type {Array<number>} */
    const flatCoordinates = pushParseAndPop(
      [null],
      this.CURVE_PARSERS,
      node,
      objectStack,
      this
    );
    if (flatCoordinates) {
      const lineString = new LineString(flatCoordinates, 'XYZ');
      return lineString;
    }
    return undefined;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {import("../extent.js").Extent|undefined} Envelope.
   */
  readEnvelope(node, objectStack) {
    /** @type {Array<number>} */
    const flatCoordinates = pushParseAndPop(
      [null],
      this.ENVELOPE_PARSERS,
      node,
      objectStack,
      this
    );
    return createOrUpdate(
      flatCoordinates[1][0],
      flatCoordinates[1][1],
      flatCoordinates[2][0],
      flatCoordinates[2][1]
    );
  }

  /**
   * @param {Node} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<number>|undefined} Flat coordinates.
   */
  readFlatPos(node, objectStack) {
    let s = getAllTextContent(node, false);
    const re = /^\s*([+\-]?\d*\.?\d+(?:[eE][+\-]?\d+)?)\s*/;
    /** @type {Array<number>} */
    const flatCoordinates = [];
    let m;
    while ((m = re.exec(s))) {
      flatCoordinates.push(parseFloat(m[1]));
      s = s.substr(m[0].length);
    }
    if (s !== '') {
      return undefined;
    }
    const context = objectStack[0];
    const containerSrs = context['srsName'];
    let axisOrientation = 'enu';
    if (containerSrs) {
      const proj = getProjection(containerSrs);
      axisOrientation = proj.getAxisOrientation();
    }
    if (axisOrientation === 'neu') {
      let i, ii;
      for (i = 0, ii = flatCoordinates.length; i < ii; i += 3) {
        const y = flatCoordinates[i];
        const x = flatCoordinates[i + 1];
        flatCoordinates[i] = x;
        flatCoordinates[i + 1] = y;
      }
    }
    const len = flatCoordinates.length;
    if (len == 2) {
      flatCoordinates.push(0);
    }
    if (len === 0) {
      return undefined;
    }
    return flatCoordinates;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<number>|undefined} Flat coordinates.
   */
  readFlatPosList(node, objectStack) {
    const s = getAllTextContent(node, false).replace(/^\s*|\s*$/g, '');
    const context = objectStack[0];
    const containerSrs = context['srsName'];
    const contextDimension = context['srsDimension'];
    let axisOrientation = 'enu';
    if (containerSrs) {
      const proj = getProjection(containerSrs);
      axisOrientation = proj.getAxisOrientation();
    }
    const coords = s.split(/\s+/);
    // The "dimension" attribute is from the GML 3.0.1 spec.
    let dim = 2;
    if (node.getAttribute('srsDimension')) {
      dim = readNonNegativeIntegerString(node.getAttribute('srsDimension'));
    } else if (node.getAttribute('dimension')) {
      dim = readNonNegativeIntegerString(node.getAttribute('dimension'));
    } else if (
      /** @type {Element} */ (node.parentNode).getAttribute('srsDimension')
    ) {
      dim = readNonNegativeIntegerString(
        /** @type {Element} */ (node.parentNode).getAttribute('srsDimension')
      );
    } else if (contextDimension) {
      dim = readNonNegativeIntegerString(contextDimension);
    }
    let x, y, z;
    const flatCoordinates = [];
    for (let i = 0, ii = coords.length; i < ii; i += dim) {
      x = parseFloat(coords[i]);
      y = parseFloat(coords[i + 1]);
      z = dim === 3 ? parseFloat(coords[i + 2]) : 0;
      if (axisOrientation.substr(0, 2) === 'en') {
        flatCoordinates.push(x, y, z);
      } else {
        flatCoordinates.push(y, x, z);
      }
    }
    return flatCoordinates;
  }

  /**
   * @param {Element} node Node.
   * @param {import("../geom/Point.js").default} value Point geometry.
   * @param {Array<*>} objectStack Node stack.
   * @private
   */
  writePos_(node, value, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const hasZ = context['hasZ'];
    const srsDimension = hasZ ? '3' : '2';
    node.setAttribute('srsDimension', srsDimension);
    const srsName = context['srsName'];
    let axisOrientation = 'enu';
    if (srsName) {
      axisOrientation = getProjection(srsName).getAxisOrientation();
    }
    const point = value.getCoordinates();
    let coords;
    // only 2d for simple features profile
    if (axisOrientation.substr(0, 2) === 'en') {
      coords = point[0] + ' ' + point[1];
    } else {
      coords = point[1] + ' ' + point[0];
    }
    if (hasZ) {
      // For newly created points, Z can be undefined.
      const z = point[2] || 0;
      coords += ' ' + z;
    }
    writeStringTextNode(node, coords);
  }

  /**
   * @param {Array<number>} point Point geometry.
   * @param {string} [srsName] Optional srsName
   * @param {boolean} [hasZ] whether the geometry has a Z coordinate (is 3D) or not.
   * @return {string} The coords string.
   * @private
   */
  getCoords_(point, srsName, hasZ) {
    let axisOrientation = 'enu';
    if (srsName) {
      axisOrientation = getProjection(srsName).getAxisOrientation();
    }
    let coords =
      axisOrientation.substr(0, 2) === 'en'
        ? point[0] + ' ' + point[1]
        : point[1] + ' ' + point[0];
    if (hasZ) {
      // For newly created points, Z can be undefined.
      const z = point[2] || 0;
      coords += ' ' + z;
    }

    return coords;
  }

  /**
   * @param {Element} node Node.
   * @param {LineString|import("../geom/LinearRing.js").default} value Geometry.
   * @param {Array<*>} objectStack Node stack.
   * @private
   */
  writePosList_(node, value, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const hasZ = context['hasZ'];
    const srsDimension = hasZ ? '3' : '2';
    node.setAttribute('srsDimension', srsDimension);
    const srsName = context['srsName'];
    // only 2d for simple features profile
    const points = value.getCoordinates();
    const len = points.length;
    const parts = new Array(len);
    let point;
    for (let i = 0; i < len; ++i) {
      point = points[i];
      parts[i] = this.getCoords_(point, srsName, hasZ);
    }
    writeStringTextNode(node, parts.join(' '));
  }

  /**
   * @param {Element} node Node.
   * @param {import("../geom/Point.js").default} geometry Point geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writePoint(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const srsName = context['srsName'];
    if (srsName) {
      node.setAttribute('srsName', srsName);
    }
    const pos = createElementNS(node.namespaceURI, 'pos');
    node.appendChild(pos);
    this.writePos_(pos, geometry, objectStack);
  }

  /**
   * @param {Element} node Node.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {Array<*>} objectStack Node stack.
   */
  writeEnvelope(node, extent, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const srsName = context['srsName'];
    if (srsName) {
      node.setAttribute('srsName', srsName);
    }
    const keys = ['lowerCorner', 'upperCorner'];
    const values = [extent[0] + ' ' + extent[1], extent[2] + ' ' + extent[3]];
    pushSerializeAndPop(
      /** @type {import("../xml.js").NodeStackItem} */
      ({node: node}),
      this.ENVELOPE_SERIALIZERS,
      OBJECT_PROPERTY_NODE_FACTORY,
      values,
      objectStack,
      keys,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {import("../geom/LinearRing.js").default} geometry LinearRing geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeLinearRing(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const srsName = context['srsName'];
    if (srsName) {
      node.setAttribute('srsName', srsName);
    }
    const posList = createElementNS(node.namespaceURI, 'posList');
    node.appendChild(posList);
    this.writePosList_(posList, geometry, objectStack);
  }

  /**
   * @param {*} value Value.
   * @param {Array<*>} objectStack Object stack.
   * @param {string} [nodeName] Node name.
   * @return {Node} Node.
   * @private
   */
  RING_NODE_FACTORY_(value, objectStack, nodeName) {
    const context = objectStack[objectStack.length - 1];
    const parentNode = context.node;
    const exteriorWritten = context['exteriorWritten'];
    if (exteriorWritten === undefined) {
      context['exteriorWritten'] = true;
    }
    return createElementNS(
      parentNode.namespaceURI,
      exteriorWritten !== undefined ? 'interior' : 'exterior'
    );
  }

  /**
   * @param {Element} node Node.
   * @param {Polygon} geometry Polygon geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeSurfaceOrPolygon(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const hasZ = context['hasZ'];
    const srsName = context['srsName'];
    if (node.nodeName !== 'PolygonPatch' && srsName) {
      node.setAttribute('srsName', srsName);
    }
    if (node.nodeName === 'Polygon' || node.nodeName === 'PolygonPatch') {
      const rings = geometry.getLinearRings();
      pushSerializeAndPop(
        {node: node, hasZ: hasZ, srsName: srsName},
        this.RING_SERIALIZERS,
        this.RING_NODE_FACTORY_,
        rings,
        objectStack,
        undefined,
        this
      );
    } else if (node.nodeName === 'Surface') {
      const patches = createElementNS(node.namespaceURI, 'patches');
      node.appendChild(patches);
      this.writeSurfacePatches_(patches, geometry, objectStack);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {LineString} geometry LineString geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeCurveOrLineString(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const srsName = context['srsName'];
    if (node.nodeName !== 'LineStringSegment' && srsName) {
      node.setAttribute('srsName', srsName);
    }
    if (
      node.nodeName === 'LineString' ||
      node.nodeName === 'LineStringSegment'
    ) {
      const posList = createElementNS(node.namespaceURI, 'posList');
      node.appendChild(posList);
      this.writePosList_(posList, geometry, objectStack);
    } else if (node.nodeName === 'Curve') {
      const segments = createElementNS(node.namespaceURI, 'segments');
      node.appendChild(segments);
      this.writeCurveSegments_(segments, geometry, objectStack);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {MultiPolygon} geometry MultiPolygon geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeMultiSurfaceOrPolygon(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const hasZ = context['hasZ'];
    const srsName = context['srsName'];
    const surface = context['surface'];
    if (srsName) {
      node.setAttribute('srsName', srsName);
    }
    const polygons = geometry.getPolygons();
    pushSerializeAndPop(
      {node: node, hasZ: hasZ, srsName: srsName, surface: surface},
      this.SURFACEORPOLYGONMEMBER_SERIALIZERS,
      this.MULTIGEOMETRY_MEMBER_NODE_FACTORY_,
      polygons,
      objectStack,
      undefined,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {import("../geom/MultiPoint.js").default} geometry MultiPoint geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeMultiPoint(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const srsName = context['srsName'];
    const hasZ = context['hasZ'];
    if (srsName) {
      node.setAttribute('srsName', srsName);
    }
    const points = geometry.getPoints();
    pushSerializeAndPop(
      {node: node, hasZ: hasZ, srsName: srsName},
      this.POINTMEMBER_SERIALIZERS,
      makeSimpleNodeFactory('pointMember'),
      points,
      objectStack,
      undefined,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {MultiLineString} geometry MultiLineString geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeMultiCurveOrLineString(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    const hasZ = context['hasZ'];
    const srsName = context['srsName'];
    const curve = context['curve'];
    if (srsName) {
      node.setAttribute('srsName', srsName);
    }
    const lines = geometry.getLineStrings();
    pushSerializeAndPop(
      {node: node, hasZ: hasZ, srsName: srsName, curve: curve},
      this.LINESTRINGORCURVEMEMBER_SERIALIZERS,
      this.MULTIGEOMETRY_MEMBER_NODE_FACTORY_,
      lines,
      objectStack,
      undefined,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {import("../geom/LinearRing.js").default} ring LinearRing geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeRing(node, ring, objectStack) {
    const linearRing = createElementNS(node.namespaceURI, 'LinearRing');
    node.appendChild(linearRing);
    this.writeLinearRing(linearRing, ring, objectStack);
  }

  /**
   * @param {Node} node Node.
   * @param {Polygon} polygon Polygon geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeSurfaceOrPolygonMember(node, polygon, objectStack) {
    const child = this.GEOMETRY_NODE_FACTORY_(polygon, objectStack);
    if (child) {
      node.appendChild(child);
      this.writeSurfaceOrPolygon(child, polygon, objectStack);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {import("../geom/Point.js").default} point Point geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writePointMember(node, point, objectStack) {
    const child = createElementNS(node.namespaceURI, 'Point');
    node.appendChild(child);
    this.writePoint(child, point, objectStack);
  }

  /**
   * @param {Node} node Node.
   * @param {LineString} line LineString geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeLineStringOrCurveMember(node, line, objectStack) {
    const child = this.GEOMETRY_NODE_FACTORY_(line, objectStack);
    if (child) {
      node.appendChild(child);
      this.writeCurveOrLineString(child, line, objectStack);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Polygon} polygon Polygon geometry.
   * @param {Array<*>} objectStack Node stack.
   * @private
   */
  writeSurfacePatches_(node, polygon, objectStack) {
    const child = createElementNS(node.namespaceURI, 'PolygonPatch');
    node.appendChild(child);
    this.writeSurfaceOrPolygon(child, polygon, objectStack);
  }

  /**
   * @param {Element} node Node.
   * @param {LineString} line LineString geometry.
   * @param {Array<*>} objectStack Node stack.
   * @private
   */
  writeCurveSegments_(node, line, objectStack) {
    const child = createElementNS(node.namespaceURI, 'LineStringSegment');
    node.appendChild(child);
    this.writeCurveOrLineString(child, line, objectStack);
  }

  /**
   * @param {Node} node Node.
   * @param {import("../geom/Geometry.js").default|import("../extent.js").Extent} geometry Geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeGeometryElement(node, geometry, objectStack) {
    const context = /** @type {import("./Feature.js").WriteOptions} */ (
      objectStack[objectStack.length - 1]
    );
    const item = Object.assign({}, context);
    item['node'] = node;
    let value;
    if (Array.isArray(geometry)) {
      value = transformExtentWithOptions(
        /** @type {import("../extent.js").Extent} */ (geometry),
        context
      );
    } else {
      value = transformGeometryWithOptions(
        /** @type {import("../geom/Geometry.js").default} */ (geometry),
        true,
        context
      );
    }
    pushSerializeAndPop(
      /** @type {import("../xml.js").NodeStackItem} */
      (item),
      this.GEOMETRY_SERIALIZERS,
      this.GEOMETRY_NODE_FACTORY_,
      [value],
      objectStack,
      undefined,
      this
    );
  }

  /**
   * @param {Element} node Node.
   * @param {import("../Feature.js").default} feature Feature.
   * @param {Array<*>} objectStack Node stack.
   */
  writeFeatureElement(node, feature, objectStack) {
    const fid = feature.getId();
    if (fid) {
      node.setAttribute('fid', /** @type {string} */ (fid));
    }
    const context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    const featureNS = context['featureNS'];
    const geometryName = feature.getGeometryName();
    if (!context.serializers) {
      context.serializers = {};
      context.serializers[featureNS] = {};
    }
    const keys = [];
    const values = [];
    if (feature.hasProperties()) {
      const properties = feature.getProperties();
      for (const key in properties) {
        const value = properties[key];
        if (value !== null) {
          keys.push(key);
          values.push(value);
          if (
            key == geometryName ||
            typeof (/** @type {?} */ (value).getSimplifiedGeometry) ===
              'function'
          ) {
            if (!(key in context.serializers[featureNS])) {
              context.serializers[featureNS][key] = makeChildAppender(
                this.writeGeometryElement,
                this
              );
            }
          } else {
            if (!(key in context.serializers[featureNS])) {
              context.serializers[featureNS][key] =
                makeChildAppender(writeStringTextNode);
            }
          }
        }
      }
    }
    const item = Object.assign({}, context);
    item.node = node;
    pushSerializeAndPop(
      /** @type {import("../xml.js").NodeStackItem} */
      (item),
      context.serializers,
      makeSimpleNodeFactory(undefined, featureNS),
      values,
      objectStack,
      keys
    );
  }

  /**
   * @param {Node} node Node.
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {Array<*>} objectStack Node stack.
   * @private
   */
  writeFeatureMembers_(node, features, objectStack) {
    const context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    const featureType = context['featureType'];
    const featureNS = context['featureNS'];
    /** @type {Object<string, Object<string, import("../xml.js").Serializer>>} */
    const serializers = {};
    serializers[featureNS] = {};
    serializers[featureNS][featureType] = makeChildAppender(
      this.writeFeatureElement,
      this
    );
    const item = Object.assign({}, context);
    item.node = node;
    pushSerializeAndPop(
      /** @type {import("../xml.js").NodeStackItem} */
      (item),
      serializers,
      makeSimpleNodeFactory(featureType, featureNS),
      features,
      objectStack
    );
  }

  /**
   * @const
   * @param {*} value Value.
   * @param {Array<*>} objectStack Object stack.
   * @param {string} [nodeName] Node name.
   * @return {Node|undefined} Node.
   * @private
   */
  MULTIGEOMETRY_MEMBER_NODE_FACTORY_(value, objectStack, nodeName) {
    const parentNode = objectStack[objectStack.length - 1].node;
    return createElementNS(
      this.namespace,
      MULTIGEOMETRY_TO_MEMBER_NODENAME[parentNode.nodeName]
    );
  }

  /**
   * @const
   * @param {*} value Value.
   * @param {Array<*>} objectStack Object stack.
   * @param {string} [nodeName] Node name.
   * @return {Element|undefined} Node.
   * @private
   */
  GEOMETRY_NODE_FACTORY_(value, objectStack, nodeName) {
    const context = objectStack[objectStack.length - 1];
    const multiSurface = context['multiSurface'];
    const surface = context['surface'];
    const curve = context['curve'];
    const multiCurve = context['multiCurve'];
    if (!Array.isArray(value)) {
      nodeName = /** @type {import("../geom/Geometry.js").default} */ (
        value
      ).getType();
      if (nodeName === 'MultiPolygon' && multiSurface === true) {
        nodeName = 'MultiSurface';
      } else if (nodeName === 'Polygon' && surface === true) {
        nodeName = 'Surface';
      } else if (nodeName === 'LineString' && curve === true) {
        nodeName = 'Curve';
      } else if (nodeName === 'MultiLineString' && multiCurve === true) {
        nodeName = 'MultiCurve';
      }
    } else {
      nodeName = 'Envelope';
    }
    return createElementNS(this.namespace, nodeName);
  }

  /**
   * Encode a geometry in GML 3.1.1 Simple Features.
   *
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [options] Options.
   * @return {Node} Node.
   * @api
   */
  writeGeometryNode(geometry, options) {
    options = this.adaptOptions(options);
    const geom = createElementNS(this.namespace, 'geom');
    const context = {
      node: geom,
      hasZ: this.hasZ,
      srsName: this.srsName,
      curve: this.curve_,
      surface: this.surface_,
      multiSurface: this.multiSurface_,
      multiCurve: this.multiCurve_,
    };
    if (options) {
      Object.assign(context, options);
    }
    this.writeGeometryElement(geom, geometry, [context]);
    return geom;
  }

  /**
   * Encode an array of features in the GML 3.1.1 format as an XML node.
   *
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions} [options] Options.
   * @return {Element} Node.
   * @api
   */
  writeFeaturesNode(features, options) {
    options = this.adaptOptions(options);
    const node = createElementNS(this.namespace, 'featureMembers');
    node.setAttributeNS(
      XML_SCHEMA_INSTANCE_URI,
      'xsi:schemaLocation',
      this.schemaLocation
    );
    const context = {
      srsName: this.srsName,
      hasZ: this.hasZ,
      curve: this.curve_,
      surface: this.surface_,
      multiSurface: this.multiSurface_,
      multiCurve: this.multiCurve_,
      featureNS: this.featureNS,
      featureType: this.featureType,
    };
    if (options) {
      Object.assign(context, options);
    }
    this.writeFeatureMembers_(node, features, [context]);
    return node;
  }
}
