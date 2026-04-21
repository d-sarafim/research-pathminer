_waitForAsset(assetId) {
    this._waitingAssets.add(assetId);
    this._registry.once('add:' + assetId, this._onAddAsset, this);
}
