_keyDown(evt) {
  if (this._active && evt.keyCode === 27) {
    this._closeThroughCaller();

    evt.preventDefault();
  }
}
