export class SelectEvent extends Event {
  /**
   * @param {SelectEventType} type The event type.
   * @param {Array<import("../Feature.js").default>} selected Selected features.
   * @param {Array<import("../Feature.js").default>} deselected Deselected features.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Associated
   *     {@link module:ol/MapBrowserEvent~MapBrowserEvent}.
   */
  constructor(type, selected, deselected, mapBrowserEvent) {
    super(type);

    /**
     * Selected features array.
     * @type {Array<import("../Feature.js").default>}
     * @api
     */
    this.selected = selected;

    /**
     * Deselected features array.
     * @type {Array<import("../Feature.js").default>}
     * @api
     */
    this.deselected = deselected;

    /**
     * Associated {@link module:ol/MapBrowserEvent~MapBrowserEvent}.
     * @type {import("../MapBrowserEvent.js").default}
     * @api
     */
    this.mapBrowserEvent = mapBrowserEvent;
  }
}
