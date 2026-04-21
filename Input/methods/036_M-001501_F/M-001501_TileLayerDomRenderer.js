_noTilesToLoad() {
    for (const key in this._tiles) {
        if (!this._tiles[key].loaded) {
            return false;
        }
    }
    return true;
}
