class LogicalNary extends Filter {
  /**
   * @param {!string} tagName The XML tag name for this filter.
   * @param {Array<import("./Filter.js").default>} conditions Conditions.
   */
  constructor(tagName, conditions) {
    super(tagName);

    /**
     * @type {Array<import("./Filter.js").default>}
     */
    this.conditions = conditions;
    assert(this.conditions.length >= 2, 'At least 2 conditions are required');
  }
}
