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
