class GML32 extends GML3 {
  /**
   * @param {import("./GMLBase.js").Options} [options] Optional configuration object.
   */
  constructor(options) {
    options = options ? options : {};

    super(options);

    /**
     * @type {string}
     */
    this.schemaLocation = options.schemaLocation
      ? options.schemaLocation
      : this.namespace + ' http://schemas.opengis.net/gml/3.2.1/gml.xsd';
  }

  /**
   * @param {Node} node Node.
   * @param {import("../geom/Geometry.js").default|import("../extent.js").Extent} geometry Geometry.
   * @param {Array<*>} objectStack Node stack.
   */
  writeGeometryElement(node, geometry, objectStack) {
    const context = objectStack[objectStack.length - 1];
    objectStack[objectStack.length - 1] = Object.assign(
      {multiCurve: true, multiSurface: true},
      context
    );
    super.writeGeometryElement(node, geometry, objectStack);
  }
}
