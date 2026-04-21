_removeTile(key) {
    const tile = this._tiles[key];
    if (!tile) {
        return;
    }

    removeDomNode(tile.el);

    delete this._tiles[key];

    /**
     * tileunload event, fired when layer is 'dom' rendered and a tile is removed
     *
     * @event TileLayer#tileunload
     * @type {Object}
     * @property {String} type - tileunload
     * @property {TileLayer} target - tile layer
     * @property {Object} tile - tile
     */
    this.layer.fire('tileunload', {
        tile: tile
    });
}
