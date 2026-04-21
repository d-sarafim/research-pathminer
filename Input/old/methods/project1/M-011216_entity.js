destroy() {
    this._destroying = true;

    // Disable all enabled components first
    for (const name in this.c) {
        this.c[name].enabled = false;
    }

    // Remove all components
    for (const name in this.c) {
        this.c[name].system.removeComponent(this);
    }

    super.destroy();

    // remove from entity index
    if (this._guid) {
        delete this._app._entityIndex[this._guid];
    }

    this._destroying = false;
}
