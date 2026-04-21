set material(value) {
    this._material = value;
    if (this._meshInstance) {
        this._meshInstance.material = value;
    }
}
