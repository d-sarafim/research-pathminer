detach() {
    if (!this._element) {
        Debug.warn('Unable to detach keyboard. It is not attached to an element.');
        return;
    }

    this._element.removeEventListener('keydown', this._keyDownHandler);
    this._element.removeEventListener('keypress', this._keyPressHandler);
    this._element.removeEventListener('keyup', this._keyUpHandler);
    this._element = null;

    document.removeEventListener('visibilitychange', this._visibilityChangeHandler, false);
    window.removeEventListener('blur', this._windowBlurHandler, false);
}
