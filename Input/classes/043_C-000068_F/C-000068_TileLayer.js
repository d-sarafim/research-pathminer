class TileHashset {
    constructor() {
        this._table = isSetAvailable ? new Set() : {};
    }

    add(key) {
        if (isSetAvailable) {
            this._table.add(key);
        } else {
            this._table[key] = true;
        }
    }

    has(key) {
        if (isSetAvailable) {
            return this._table.has(key);
        } else {
            return this._table[key];
        }
    }

    reset() {
        if (isSetAvailable) {
            this._table.clear();
        } else {
            this._table = {};
        }

    }
}
