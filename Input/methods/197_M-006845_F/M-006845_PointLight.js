set constantAttenuation(value) {
    this._state.attenuation[0] = value || 0.0;
    this.glRedraw();
}
