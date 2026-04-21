onSetAssets(name, oldValue, newValue) {
    const newAssets = [];
    const len = newValue.length;

    if (oldValue && oldValue.length) {
        for (let i = 0; i < oldValue.length; i++) {
            // unsubscribe from change event for old assets
            if (oldValue[i]) {
                const asset = this.system.app.assets.get(oldValue[i]);
                if (asset) {
                    asset.off('change', this.onAssetChanged, this);
                    asset.off('remove', this.onAssetRemoved, this);

                    if (this.currentSource === asset.name) {
                        this.stop();
                    }
                }
            }
        }
    }

    if (len) {
        for (let i = 0; i < len; i++) {
            if (oldValue.indexOf(newValue[i]) < 0) {
                if (newValue[i] instanceof Asset) {
                    newAssets.push(newValue[i].id);
                } else {
                    newAssets.push(newValue[i]);
                }

            }
        }
    }

     // Only load audio data if we are not in the tools and if changes have been made
    if (!this.system._inTools && newAssets.length) {
        this.loadAudioSourceAssets(newAssets);
    }
}
