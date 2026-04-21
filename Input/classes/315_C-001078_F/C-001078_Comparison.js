class Comparison extends Filter {
  /**
   * @param {!string} tagName The XML tag name for this filter.
   * @param {!string} propertyName Name of the context property to compare.
   */
  constructor(tagName, propertyName) {
    super(tagName);

    /**
     * @type {!string}
     */
    this.propertyName = propertyName;
  }
}
