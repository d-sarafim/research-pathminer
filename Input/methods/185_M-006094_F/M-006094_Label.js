setHighlighted(highlighted) {
    if (this._highlighted === highlighted) {
        return;
    }
    this._highlighted = !!highlighted;
    if (this._highlighted) {
        this._label.classList.add(this._highlightClass);
    } else {
        this._label.classList.remove(this._highlightClass);
    }
}
