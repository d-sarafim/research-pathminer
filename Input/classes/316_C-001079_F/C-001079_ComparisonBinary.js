class ComparisonBinary extends Comparison {
  /**
   * @param {!string} tagName The XML tag name for this filter.
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!(string|number)} expression The value to compare.
   * @param {boolean} [matchCase] Case-sensitive?
   */
  constructor(tagName, propertyName, expression, matchCase) {
    super(tagName, propertyName);

    /**
     * @type {!(string|number)}
     */
    this.expression = expression;

    /**
     * @type {boolean|undefined}
     */
    this.matchCase = matchCase;
  }
}
