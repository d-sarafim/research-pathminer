remove() {
    if (!this._map) {
        return this;
    }
    removeDomNode(this.__ctrlContainer);
    if (this.onRemove) {
        this.onRemove();
    }
    delete this._map;
    delete this.__ctrlContainer;
    delete this._controlDom;
    /**
     * remove event.
     *
     * @event control.Control#remove
     * @type {Object}
     * @property {String} type - remove
     * @property {control.Control} target - the control instance
     */
    this.fire('remove');
    return this;
}
