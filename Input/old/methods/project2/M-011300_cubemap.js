update(cubemapAsset, assetIds, assets) {
    const assetData = cubemapAsset.data || {};
    const oldAssets = cubemapAsset._handlerState.assets;
    const oldResources = cubemapAsset._resources;
    let tex, mip, i;

    // faces, prelit cubemap 128, 64, 32, 16, 8, 4
    const resources = [null, null, null, null, null, null, null];

    // texture type used for faces and prelit cubemaps are both taken from
    // cubemap.data.rgbm
    const getType = function () {
        if (assetData.hasOwnProperty('type')) {
            return assetData.type;
        }
        if (assetData.hasOwnProperty('rgbm')) {
            return assetData.rgbm ? TEXTURETYPE_RGBM : TEXTURETYPE_DEFAULT;
        }
        return null;
    };

    // handle the prelit data
    if (!cubemapAsset.loaded || assets[0] !== oldAssets[0]) {
        // prelit asset changed
        if (assets[0]) {
            tex = assets[0].resource;
            if (tex.cubemap) {
                for (i = 0; i < 6; ++i) {
                    resources[i + 1] = new Texture(this._device, {
                        name: cubemapAsset.name + '_prelitCubemap' + (tex.width >> i),
                        cubemap: true,
                        // assume prefiltered data has same encoding as the faces asset
                        type: getType() || tex.type,
                        width: tex.width >> i,
                        height: tex.height >> i,
                        format: tex.format,
                        levels: [tex._levels[i]],
                        fixCubemapSeams: true,
                        addressU: ADDRESS_CLAMP_TO_EDGE,
                        addressV: ADDRESS_CLAMP_TO_EDGE,
                        // generate cubemaps on the top level only
                        mipmaps: i === 0
                    });
                }
            } else {
                // prefiltered data is an env atlas
                tex.type = TEXTURETYPE_RGBP;
                resources[1] = tex;
            }
        }
    } else {
        // prelit asset didn't change so keep the existing cubemap resources
        resources[1] = oldResources[1] || null;
        resources[2] = oldResources[2] || null;
        resources[3] = oldResources[3] || null;
        resources[4] = oldResources[4] || null;
        resources[5] = oldResources[5] || null;
        resources[6] = oldResources[6] || null;
    }

    const faceAssets = assets.slice(1);
    if (!cubemapAsset.loaded || !this.cmpArrays(faceAssets, oldAssets.slice(1))) {
        // face assets have changed
        if (faceAssets.indexOf(null) === -1) {
            // extract cubemap level data from face textures
            const faceTextures = faceAssets.map(function (asset) {
                return asset.resource;
            });
            const faceLevels = [];
            for (mip = 0; mip < faceTextures[0]._levels.length; ++mip) {
                faceLevels.push(faceTextures.map(function (faceTexture) {  // eslint-disable-line no-loop-func
                    return faceTexture._levels[mip];
                }));
            }

            // Force RGBA8 if we are loading a RGB8 texture due to a bug on M1 Macs Monterey and Chrome not
            // rendering the face on right of the cubemap (`faceAssets[0]` and `resources[1]`).
            // Using a RGBA8 texture works around the issue https://github.com/playcanvas/engine/issues/4091
            const format = faceTextures[0].format;

            const faces = new Texture(this._device, {
                name: cubemapAsset.name + '_faces',
                cubemap: true,
                type: getType() || faceTextures[0].type,
                width: faceTextures[0].width,
                height: faceTextures[0].height,
                format: format === PIXELFORMAT_RGB8 ? PIXELFORMAT_RGBA8 : format,
                mipmaps: assetData.mipmaps ?? true,
                levels: faceLevels,
                minFilter: assetData.hasOwnProperty('minFilter') ? assetData.minFilter : faceTextures[0].minFilter,
                magFilter: assetData.hasOwnProperty('magFilter') ? assetData.magFilter : faceTextures[0].magFilter,
                anisotropy: assetData.hasOwnProperty('anisotropy') ? assetData.anisotropy : 1,
                addressU: ADDRESS_CLAMP_TO_EDGE,
                addressV: ADDRESS_CLAMP_TO_EDGE,
                fixCubemapSeams: !!assets[0]
            });

            resources[0] = faces;
        }
    } else {
        // no faces changed so keep existing faces cubemap
        resources[0] = oldResources[0] || null;
    }

    // check if any resource changed
    if (!this.cmpArrays(resources, oldResources)) {
        // set the new resources, change events will fire
        cubemapAsset.resources = resources;
        cubemapAsset._handlerState.assetIds = assetIds;
        cubemapAsset._handlerState.assets = assets;

        // destroy the old cubemap resources that are not longer needed
        for (i = 0; i < oldResources.length; ++i) {
            if (oldResources[i] !== null && resources.indexOf(oldResources[i]) === -1) {
                oldResources[i].destroy();
            }
        }
    }

    // destroy old assets which have been replaced
    for (i = 0; i < oldAssets.length; ++i) {
        if (oldAssets[i] !== null && assets.indexOf(oldAssets[i]) === -1) {
            oldAssets[i].unload();
        }
    }
}
