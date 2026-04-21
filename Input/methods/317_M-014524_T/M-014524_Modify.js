handlePointerAtPixel_(pixel, map, coordinate) {
  const pixelCoordinate = coordinate || map.getCoordinateFromPixel(pixel);
  const projection = map.getView().getProjection();
  const sortByDistance = function (a, b) {
    return (
      projectedDistanceToSegmentDataSquared(pixelCoordinate, a, projection) -
      projectedDistanceToSegmentDataSquared(pixelCoordinate, b, projection)
    );
  };

  /** @type {Array<SegmentData>|undefined} */
  let nodes;
  /** @type {Point|undefined} */
  let hitPointGeometry;
  if (this.hitDetection_) {
    const layerFilter =
      typeof this.hitDetection_ === 'object'
        ? (layer) => layer === this.hitDetection_
        : undefined;
    map.forEachFeatureAtPixel(
      pixel,
      (feature, layer, geometry) => {
        if (geometry) {
          geometry = new Point(
            toUserCoordinate(geometry.getCoordinates(), projection)
          );
        }
        const geom = geometry || feature.getGeometry();
        if (
          geom.getType() === 'Point' &&
          feature instanceof Feature &&
          this.features_.getArray().includes(feature)
        ) {
          hitPointGeometry = /** @type {Point} */ (geom);
          const coordinate = /** @type {Point} */ (feature.getGeometry())
            .getFlatCoordinates()
            .slice(0, 2);
          nodes = [
            {
              feature,
              geometry: hitPointGeometry,
              segment: [coordinate, coordinate],
            },
          ];
        }
        return true;
      },
      {layerFilter}
    );
  }
  if (!nodes) {
    const viewExtent = fromUserExtent(
      createExtent(pixelCoordinate, tempExtent),
      projection
    );
    const buffer = map.getView().getResolution() * this.pixelTolerance_;
    const box = toUserExtent(
      bufferExtent(viewExtent, buffer, tempExtent),
      projection
    );
    nodes = this.rBush_.getInExtent(box);
  }

  if (nodes && nodes.length > 0) {
    const node = nodes.sort(sortByDistance)[0];
    const closestSegment = node.segment;
    let vertex = closestOnSegmentData(pixelCoordinate, node, projection);
    const vertexPixel = map.getPixelFromCoordinate(vertex);
    let dist = coordinateDistance(pixel, vertexPixel);
    if (hitPointGeometry || dist <= this.pixelTolerance_) {
      /** @type {Object<string, boolean>} */
      const vertexSegments = {};
      vertexSegments[getUid(closestSegment)] = true;

      if (!this.snapToPointer_) {
        this.delta_[0] = vertex[0] - pixelCoordinate[0];
        this.delta_[1] = vertex[1] - pixelCoordinate[1];
      }
      if (
        node.geometry.getType() === 'Circle' &&
        node.index === CIRCLE_CIRCUMFERENCE_INDEX
      ) {
        this.snappedToVertex_ = true;
        this.createOrUpdateVertexFeature_(
          vertex,
          [node.feature],
          [node.geometry]
        );
      } else {
        const pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
        const pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
        const squaredDist1 = squaredCoordinateDistance(vertexPixel, pixel1);
        const squaredDist2 = squaredCoordinateDistance(vertexPixel, pixel2);
        dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
        this.snappedToVertex_ = dist <= this.pixelTolerance_;
        if (this.snappedToVertex_) {
          vertex =
            squaredDist1 > squaredDist2
              ? closestSegment[1]
              : closestSegment[0];
        }
        this.createOrUpdateVertexFeature_(
          vertex,
          [node.feature],
          [node.geometry]
        );
        const geometries = {};
        geometries[getUid(node.geometry)] = true;
        for (let i = 1, ii = nodes.length; i < ii; ++i) {
          const segment = nodes[i].segment;
          if (
            (coordinatesEqual(closestSegment[0], segment[0]) &&
              coordinatesEqual(closestSegment[1], segment[1])) ||
            (coordinatesEqual(closestSegment[0], segment[1]) &&
              coordinatesEqual(closestSegment[1], segment[0]))
          ) {
            const geometryUid = getUid(nodes[i].geometry);
            if (!(geometryUid in geometries)) {
              geometries[geometryUid] = true;
              vertexSegments[getUid(segment)] = true;
            }
          } else {
            break;
          }
        }
      }

      this.vertexSegments_ = vertexSegments;
      return;
    }
  }
  if (this.vertexFeature_) {
    this.overlay_.getSource().removeFeature(this.vertexFeature_);
    this.vertexFeature_ = null;
  }
}
