export class ExtentEvent extends Event {
  /**
   * @param {import("../extent.js").Extent} extent the new extent
   */
  constructor(extent) {
    super(ExtentEventType.EXTENTCHANGED);

    /**
     * The current extent.
     * @type {import("../extent.js").Extent}
     * @api
     */
    this.extent = extent;
  }
}
