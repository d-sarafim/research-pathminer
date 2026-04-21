set shadowType(value) {
    if (this._shadowType !== value) {
        this._shadowType = value;

        // lit shaders need to be rebuilt
        this._dirtyLightsFnc();
    }
}
