class MixedGeometryBatch {
  constructor() {
    /**
     * @type {PolygonGeometryBatch}
     */
    this.polygonBatch = {
      entries: {},
      geometriesCount: 0,
      verticesCount: 0,
      ringsCount: 0,
    };

    /**
     * @type {PointGeometryBatch}
     */
    this.pointBatch = {
      entries: {},
      geometriesCount: 0,
    };

    /**
     * @type {LineStringGeometryBatch}
     */
    this.lineStringBatch = {
      entries: {},
      geometriesCount: 0,
      verticesCount: 0,
    };
  }

  /**
   * @param {Array<Feature|RenderFeature>} features Array of features to add to the batch
   */
  addFeatures(features) {
    for (let i = 0; i < features.length; i++) {
      this.addFeature(features[i]);
    }
  }

  /**
   * @param {Feature|RenderFeature} feature Feature to add to the batch
   */
  addFeature(feature) {
    const geometry = feature.getGeometry();
    if (!geometry) {
      return;
    }
    this.addGeometry_(geometry, feature);
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   * @private
   */
  clearFeatureEntryInPointBatch_(feature) {
    const entry = this.pointBatch.entries[getUid(feature)];
    if (!entry) {
      return;
    }
    this.pointBatch.geometriesCount -= entry.flatCoordss.length;
    delete this.pointBatch.entries[getUid(feature)];
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   * @private
   */
  clearFeatureEntryInLineStringBatch_(feature) {
    const entry = this.lineStringBatch.entries[getUid(feature)];
    if (!entry) {
      return;
    }
    this.lineStringBatch.verticesCount -= entry.verticesCount;
    this.lineStringBatch.geometriesCount -= entry.flatCoordss.length;
    delete this.lineStringBatch.entries[getUid(feature)];
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   * @private
   */
  clearFeatureEntryInPolygonBatch_(feature) {
    const entry = this.polygonBatch.entries[getUid(feature)];
    if (!entry) {
      return;
    }
    this.polygonBatch.verticesCount -= entry.verticesCount;
    this.polygonBatch.ringsCount -= entry.ringsCount;
    this.polygonBatch.geometriesCount -= entry.flatCoordss.length;
    delete this.polygonBatch.entries[getUid(feature)];
  }

  /**
   * @param {import("../../geom").Geometry|RenderFeature} geometry Geometry
   * @param {Feature|RenderFeature} feature Feature
   * @private
   */
  addGeometry_(geometry, feature) {
    const type = geometry.getType();
    switch (type) {
      case 'GeometryCollection':
        const geometries =
          /** @type {import("../../geom").GeometryCollection} */ (
            geometry
          ).getGeometriesArray();
        for (const geometry of geometries) {
          this.addGeometry_(geometry, feature);
        }
        break;
      case 'MultiPolygon':
        const multiPolygonGeom =
          /** @type {import("../../geom").MultiPolygon|RenderFeature} */ (
            geometry
          );
        this.addCoordinates_(
          type,
          multiPolygonGeom.getFlatCoordinates(),
          multiPolygonGeom.getEndss(),
          feature,
          getUid(feature),
          multiPolygonGeom.getStride()
        );
        break;
      case 'MultiLineString':
        const multiLineGeom =
          /** @type {import("../../geom").MultiLineString|RenderFeature} */ (
            geometry
          );
        this.addCoordinates_(
          type,
          multiLineGeom.getFlatCoordinates(),
          multiLineGeom.getEnds(),
          feature,
          getUid(feature),
          multiLineGeom.getStride()
        );
        break;
      case 'MultiPoint':
        const multiPointGeom =
          /** @type {import("../../geom").MultiPoint|RenderFeature} */ (
            geometry
          );
        this.addCoordinates_(
          type,
          multiPointGeom.getFlatCoordinates(),
          null,
          feature,
          getUid(feature),
          multiPointGeom.getStride()
        );
        break;
      case 'Polygon':
        const polygonGeom =
          /** @type {import("../../geom").Polygon|RenderFeature} */ (geometry);
        this.addCoordinates_(
          type,
          polygonGeom.getFlatCoordinates(),
          polygonGeom.getEnds(),
          feature,
          getUid(feature),
          polygonGeom.getStride()
        );
        break;
      case 'Point':
        const pointGeom = /** @type {import("../../geom").Point} */ (geometry);
        this.addCoordinates_(
          type,
          pointGeom.getFlatCoordinates(),
          null,
          feature,
          getUid(feature),
          pointGeom.getStride()
        );
        break;
      case 'LineString':
      case 'LinearRing':
        const lineGeom = /** @type {import("../../geom").LineString} */ (
          geometry
        );
        this.addCoordinates_(
          type,
          lineGeom.getFlatCoordinates(),
          null,
          feature,
          getUid(feature),
          lineGeom.getStride()
        );
        break;
      default:
      // pass
    }
  }

  /**
   * @param {GeometryType} type Geometry type
   * @param {Array<number>} flatCoords Flat coordinates
   * @param {Array<number> | Array<Array<number>> | null} ends Coordinate ends
   * @param {Feature|RenderFeature} feature Feature
   * @param {string} featureUid Feature uid
   * @param {number} stride Stride
   * @private
   */
  addCoordinates_(type, flatCoords, ends, feature, featureUid, stride) {
    /** @type {number} */
    let verticesCount;
    switch (type) {
      case 'MultiPolygon':
        const multiPolygonEndss = /** @type {Array<Array<number>>} */ (ends);
        for (let i = 0, ii = multiPolygonEndss.length; i < ii; i++) {
          let polygonEnds = multiPolygonEndss[i];
          const prevPolygonEnds = i > 0 ? multiPolygonEndss[i - 1] : null;
          const startIndex = prevPolygonEnds
            ? prevPolygonEnds[prevPolygonEnds.length - 1]
            : 0;
          const endIndex = polygonEnds[polygonEnds.length - 1];
          polygonEnds =
            startIndex > 0
              ? polygonEnds.map((end) => end - startIndex)
              : polygonEnds;
          this.addCoordinates_(
            'Polygon',
            flatCoords.slice(startIndex, endIndex),
            polygonEnds,
            feature,
            featureUid,
            stride
          );
        }
        break;
      case 'MultiLineString':
        const multiLineEnds = /** @type {Array<number>} */ (ends);
        for (let i = 0, ii = multiLineEnds.length; i < ii; i++) {
          const startIndex = i > 0 ? multiLineEnds[i - 1] : 0;
          this.addCoordinates_(
            'LinearRing',
            flatCoords.slice(startIndex, multiLineEnds[i]),
            null,
            feature,
            featureUid,
            stride
          );
        }
        break;
      case 'MultiPoint':
        for (let i = 0, ii = flatCoords.length; i < ii; i += stride) {
          this.addCoordinates_(
            'Point',
            flatCoords.slice(i, i + 2),
            null,
            feature,
            featureUid,
            null
          );
        }
        break;
      case 'Polygon':
        const polygonEnds = /** @type {Array<number>} */ (ends);
        // first look for a CW ring; if so, handle it and following rings as another polygon
        for (let i = 1, ii = polygonEnds.length; i < ii; i++) {
          const ringStartIndex = polygonEnds[i - 1];
          if (
            i > 0 &&
            linearRingIsClockwise(
              flatCoords,
              ringStartIndex,
              polygonEnds[i],
              stride
            )
          ) {
            this.addCoordinates_(
              'Polygon',
              flatCoords.slice(0, ringStartIndex),
              polygonEnds.slice(0, i),
              feature,
              featureUid,
              stride
            );
            this.addCoordinates_(
              'Polygon',
              flatCoords.slice(ringStartIndex),
              polygonEnds.slice(i).map((end) => end - polygonEnds[i - 1]),
              feature,
              featureUid,
              stride
            );
            return;
          }
        }
        if (!this.polygonBatch.entries[featureUid]) {
          this.polygonBatch.entries[featureUid] = {
            feature: feature,
            flatCoordss: [],
            verticesCount: 0,
            ringsCount: 0,
            ringsVerticesCounts: [],
          };
        }
        verticesCount = flatCoords.length / stride;
        const ringsCount = ends.length;
        const ringsVerticesCount = ends.map((end, ind, arr) =>
          ind > 0 ? (end - arr[ind - 1]) / stride : end / stride
        );
        this.polygonBatch.verticesCount += verticesCount;
        this.polygonBatch.ringsCount += ringsCount;
        this.polygonBatch.geometriesCount++;
        this.polygonBatch.entries[featureUid].flatCoordss.push(
          getFlatCoordinatesXY(flatCoords, stride)
        );
        this.polygonBatch.entries[featureUid].ringsVerticesCounts.push(
          ringsVerticesCount
        );
        this.polygonBatch.entries[featureUid].verticesCount += verticesCount;
        this.polygonBatch.entries[featureUid].ringsCount += ringsCount;
        for (let i = 0, ii = polygonEnds.length; i < ii; i++) {
          const startIndex = i > 0 ? polygonEnds[i - 1] : 0;
          this.addCoordinates_(
            'LinearRing',
            flatCoords.slice(startIndex, polygonEnds[i]),
            null,
            feature,
            featureUid,
            stride
          );
        }
        break;
      case 'Point':
        if (!this.pointBatch.entries[featureUid]) {
          this.pointBatch.entries[featureUid] = {
            feature: feature,
            flatCoordss: [],
          };
        }
        this.pointBatch.geometriesCount++;
        this.pointBatch.entries[featureUid].flatCoordss.push(flatCoords);
        break;
      case 'LineString':
      case 'LinearRing':
        if (!this.lineStringBatch.entries[featureUid]) {
          this.lineStringBatch.entries[featureUid] = {
            feature: feature,
            flatCoordss: [],
            verticesCount: 0,
          };
        }
        verticesCount = flatCoords.length / stride;
        this.lineStringBatch.verticesCount += verticesCount;
        this.lineStringBatch.geometriesCount++;
        this.lineStringBatch.entries[featureUid].flatCoordss.push(
          getFlatCoordinatesXY(flatCoords, stride)
        );
        this.lineStringBatch.entries[featureUid].verticesCount += verticesCount;
        break;
      default:
      // pass
    }
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   */
  changeFeature(feature) {
    this.clearFeatureEntryInPointBatch_(feature);
    this.clearFeatureEntryInPolygonBatch_(feature);
    this.clearFeatureEntryInLineStringBatch_(feature);
    const geometry = feature.getGeometry();
    if (!geometry) {
      return;
    }
    this.addGeometry_(geometry, feature);
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   */
  removeFeature(feature) {
    this.clearFeatureEntryInPointBatch_(feature);
    this.clearFeatureEntryInPolygonBatch_(feature);
    this.clearFeatureEntryInLineStringBatch_(feature);
  }

  clear() {
    this.polygonBatch.entries = {};
    this.polygonBatch.geometriesCount = 0;
    this.polygonBatch.verticesCount = 0;
    this.polygonBatch.ringsCount = 0;
    this.lineStringBatch.entries = {};
    this.lineStringBatch.geometriesCount = 0;
    this.lineStringBatch.verticesCount = 0;
    this.pointBatch.entries = {};
    this.pointBatch.geometriesCount = 0;
  }
}
