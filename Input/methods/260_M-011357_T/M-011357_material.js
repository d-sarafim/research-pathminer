_bindAndAssignAssets(materialAsset, assets) {
    // always migrate before updating material from asset data
    const data = this._parser.migrate(materialAsset.data);

    const material = materialAsset.resource;

    const pathMapping = (data.mappingFormat === 'path');

    const TEXTURES = standardMaterialTextureParameters;

    let i, name, assetReference;
    // iterate through all texture parameters
    for (i = 0; i < TEXTURES.length; i++) {
        name = TEXTURES[i];

        assetReference = material._assetReferences[name];

        // data[name] contains an asset id for a texture
        // if we have an asset id and nothing is assigned to the texture resource or the placeholder texture is assigned
        // or the data has changed
        const dataAssetId = data[name];

        const materialTexture = material[name];
        const isPlaceHolderTexture = materialTexture === this._getPlaceholderTexture(name);
        const dataValidated = data.validated;

        if (dataAssetId && (!materialTexture || !dataValidated || isPlaceHolderTexture)) {
            if (!assetReference) {
                assetReference = new AssetReference(name, materialAsset, assets, {
                    load: this._onTextureLoad,
                    add: this._onTextureAdd,
                    remove: this._onTextureRemoveOrUnload,
                    unload: this._onTextureRemoveOrUnload
                }, this);

                material._assetReferences[name] = assetReference;
            }

            if (pathMapping) {
                // texture paths are measured from the material directory
                assetReference.url = materialAsset.getAbsoluteUrl(dataAssetId);
            } else {
                assetReference.id = dataAssetId;
            }

            if (assetReference.asset) {
                if (assetReference.asset.resource) {
                    // asset is already loaded
                    this._assignTexture(name, materialAsset, assetReference.asset.resource);
                } else {
                    this._assignPlaceholderTexture(name, materialAsset);
                }

                assets.load(assetReference.asset);
            }
        } else {
            if (assetReference) {
                // texture has been removed
                if (pathMapping) {
                    assetReference.url = null;
                } else {
                    assetReference.id = null;
                }
            } else {
                // no asset reference and no data field
                // do nothing
            }
        }
    }

    const CUBEMAPS = standardMaterialCubemapParameters;

    // iterate through all cubemap parameters
    for (i = 0; i < CUBEMAPS.length; i++) {
        name = CUBEMAPS[i];

        assetReference = material._assetReferences[name];

        // data[name] contains an asset id for a cubemap
        // if we have a asset id and the prefiltered cubemap data is not set
        if (data[name] && !materialAsset.data.prefilteredCubeMap128) {
            if (!assetReference) {
                assetReference = new AssetReference(name, materialAsset, assets, {
                    load: this._onCubemapLoad,
                    add: this._onCubemapAdd,
                    remove: this._onCubemapRemoveOrUnload,
                    unload: this._onCubemapRemoveOrUnload
                }, this);

                material._assetReferences[name] = assetReference;
            }

            if (pathMapping) {
                assetReference.url = data[name];
            } else {
                assetReference.id = data[name];
            }

            if (assetReference.asset) {
                if (assetReference.asset.loaded) {
                    // asset loaded
                    this._assignCubemap(name, materialAsset, assetReference.asset.resources);
                }

                assets.load(assetReference.asset);
            }
        }


    }

    // call to re-initialize material after all textures assigned
    this._parser.initialize(material, data);
}
