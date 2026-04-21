setOpacity(op) {
    this.config('opacity', op);
    /**
    * setopacity event.
    *
    * @event Layer#setopacity
    * @type {Object}
    * @property {String} type - setopacity
    * @property {Layer} target    - the layer fires the event
    * @property {Number} opacity        - value of the opacity
    */
    this.fire('setopacity', { opacity: op });
    return this;
}
