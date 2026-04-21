constructor(device, assets, maxRetries) {
    this._device = device;
    this._assets = assets;
    this._defaultMaterial = GlbParser.createDefaultMaterial();
    this.maxRetries = maxRetries;
}
