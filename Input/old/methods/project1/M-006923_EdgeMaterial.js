set edges(value) {
    value = value !== false;
    if (this._state.edges === value) {
        return;
    }
    this._state.edges = value;
    this.glRedraw();
}
