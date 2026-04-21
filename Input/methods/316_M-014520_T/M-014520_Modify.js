handleDragEvent(evt) {
  this.ignoreNextSingleClick_ = false;
  this.willModifyFeatures_(evt, this.dragSegments_);

  const vertex = [
    evt.coordinate[0] + this.delta_[0],
    evt.coordinate[1] + this.delta_[1],
  ];
  const features = [];
  const geometries = [];
  for (let i = 0, ii = this.dragSegments_.length; i < ii; ++i) {
    const dragSegment = this.dragSegments_[i];
    const segmentData = dragSegment[0];
    const feature = segmentData.feature;
    if (!features.includes(feature)) {
      features.push(feature);
    }
    const geometry = segmentData.geometry;
    if (!geometries.includes(geometry)) {
      geometries.push(geometry);
    }
    const depth = segmentData.depth;
    let coordinates;
    const segment = segmentData.segment;
    const index = dragSegment[1];

    while (vertex.length < geometry.getStride()) {
      vertex.push(segment[index][vertex.length]);
    }

    switch (geometry.getType()) {
      case 'Point':
        coordinates = vertex;
        segment[0] = vertex;
        segment[1] = vertex;
        break;
      case 'MultiPoint':
        coordinates = geometry.getCoordinates();
        coordinates[segmentData.index] = vertex;
        segment[0] = vertex;
        segment[1] = vertex;
        break;
      case 'LineString':
        coordinates = geometry.getCoordinates();
        coordinates[segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case 'MultiLineString':
        coordinates = geometry.getCoordinates();
        coordinates[depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case 'Polygon':
        coordinates = geometry.getCoordinates();
        coordinates[depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case 'MultiPolygon':
        coordinates = geometry.getCoordinates();
        coordinates[depth[1]][depth[0]][segmentData.index + index] = vertex;
        segment[index] = vertex;
        break;
      case 'Circle':
        segment[0] = vertex;
        segment[1] = vertex;
        if (segmentData.index === CIRCLE_CENTER_INDEX) {
          this.changingFeature_ = true;
          geometry.setCenter(vertex);
          this.changingFeature_ = false;
        } else {
          // We're dragging the circle's circumference:
          this.changingFeature_ = true;
          const projection = evt.map.getView().getProjection();
          let radius = coordinateDistance(
            fromUserCoordinate(geometry.getCenter(), projection),
            fromUserCoordinate(vertex, projection)
          );
          const userProjection = getUserProjection();
          if (userProjection) {
            const circleGeometry = geometry
              .clone()
              .transform(userProjection, projection);
            circleGeometry.setRadius(radius);
            radius = circleGeometry
              .transform(projection, userProjection)
              .getRadius();
          }
          geometry.setRadius(radius);
          this.changingFeature_ = false;
        }
        break;
      default:
      // pass
    }

    if (coordinates) {
      this.setGeometryCoordinates_(geometry, coordinates);
    }
  }
  this.createOrUpdateVertexFeature_(vertex, features, geometries);
}
