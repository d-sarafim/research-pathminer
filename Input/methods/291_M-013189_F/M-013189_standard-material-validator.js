setInvalid(key, data) {
    this.valid = false;

    Debug.warn(`Ignoring invalid StandardMaterial property: ${key}`, data[key]);

    if (this.removeInvalid) {
        delete data[key];
    }
}
