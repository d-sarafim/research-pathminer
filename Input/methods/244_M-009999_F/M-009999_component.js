onSetRenderAsset(name, oldValue, newValue) {
    const assets = this.system.app.assets;

    if (oldValue) {
        // Remove old listeners
        const asset = assets.get(oldValue);
        if (asset) {
            asset.off('remove', this.onRenderAssetRemoved, this);
        }
    }

    if (newValue) {
        if (newValue instanceof Asset) {
            this.data.renderAsset = newValue.id;
        }

        const asset = assets.get(this.data.renderAsset);
        if (asset) {
            // make sure we don't subscribe twice
            asset.off('remove', this.onRenderAssetRemoved, this);
            asset.on('remove', this.onRenderAssetRemoved, this);
        }
    }

    if (this.data.initialized && this.data.type === 'mesh') {
        if (!newValue) {
            // if render asset is null set render to null
            // so that it's going to be removed from the simulation
            this.data.render = null;
        }
        this.system.recreatePhysicalShapes(this);
    }
}
