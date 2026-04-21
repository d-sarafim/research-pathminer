set clippable(clippable) {
    clippable = clippable !== false;
    this._clippable = clippable;
    for (let i = 0, len = this._children.length; i < len; i++) {
        this._children[i].clippable = clippable;
    }
}
