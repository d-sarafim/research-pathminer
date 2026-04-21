set assets(value) {
    const assets = this._assets;

    if (assets && assets.length) {
        for (let i = 0; i < assets.length; i++) {
            // unsubscribe from change event for old assets
            if (assets[i]) {
                const asset = this.system.app.assets.get(assets[i]);
                if (asset) {
                    asset.off('change', this.onAssetChanged, this);
                    asset.off('remove', this.onAssetRemoved, this);

                    const animName = this.animationsIndex[asset.id];

                    if (this.currAnim === animName)
                        this._stopCurrentAnimation();

                    delete this.animations[animName];
                    delete this.animationsIndex[asset.id];
                }
            }
        }
    }

    this._assets = value;

    const assetIds = value.map((value) => {
        return (value instanceof Asset) ? value.id : value;
    });

    this.loadAnimationAssets(assetIds);
}
