_onModelAssetChange(asset, attr, _new, _old) {
    if (attr === 'data') {
        this.mapping = this._mapping;
    }
}
