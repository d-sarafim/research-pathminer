class DWithin extends Spatial {
  /**
   * @param {!string} geometryName Geometry name to use.
   * @param {!import("../../geom/Geometry.js").default} geometry Geometry.
   * @param {!number} distance Distance.
   * @param {!string} unit Unit.
   * @param {string} [srsName] SRS name. No srsName attribute will be
   *    set on geometries when this is not provided.
   */
  constructor(geometryName, geometry, distance, unit, srsName) {
    super('DWithin', geometryName, geometry, srsName);

    /**
     * @public
     * @type {!number}
     */
    this.distance = distance;

    /**
     * @public
     * @type {!string}
     */
    this.unit = unit;
  }
}
