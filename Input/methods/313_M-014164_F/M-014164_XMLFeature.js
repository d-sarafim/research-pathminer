constructor() {
  super();

  /**
   * @type {XMLSerializer}
   * @private
   */
  this.xmlSerializer_ = getXMLSerializer();
}
