class Command {
    constructor(layer, blendType, command) {
        this._key = [];
        this._key[SORTKEY_FORWARD] = getKey(layer, blendType, true, 0);
        this.command = command;
    }

    set key(val) {
        this._key[SORTKEY_FORWARD] = val;
    }

    get key() {
        return this._key[SORTKEY_FORWARD];
    }
}
