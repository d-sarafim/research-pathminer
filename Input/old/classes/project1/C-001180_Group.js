export class GroupEvent extends Event {
  /**
   * @param {EventType} type The event type.
   * @param {BaseLayer} layer The layer.
   */
  constructor(type, layer) {
    super(type);

    /**
     * The added or removed layer.
     * @type {BaseLayer}
     * @api
     */
    this.layer = layer;
  }
}
