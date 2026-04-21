class EPSG3857Projection extends Projection {
  /**
   * @param {string} code Code.
   */
  constructor(code) {
    super({
      code: code,
      units: 'm',
      extent: EXTENT,
      global: true,
      worldExtent: WORLD_EXTENT,
      getPointResolution: function (resolution, point) {
        return resolution / Math.cosh(point[1] / RADIUS);
      },
    });
  }
}
