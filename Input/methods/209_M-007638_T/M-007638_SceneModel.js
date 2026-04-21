createTexture(cfg) {
    const textureId = cfg.id;
    if (textureId === undefined || textureId === null) {
        this.error("[createTexture] Config missing: id");
        return;
    }
    if (this._textures[textureId]) {
        this.error("[createTexture] Texture already created: " + textureId);
        return;
    }
    if (!cfg.src && !cfg.image && !cfg.buffers) {
        this.error("[createTexture] Param expected: `src`, `image' or 'buffers'");
        return null;
    }
    let minFilter = cfg.minFilter || LinearMipmapLinearFilter;
    if (minFilter !== LinearFilter &&
        minFilter !== LinearMipMapNearestFilter &&
        minFilter !== LinearMipmapLinearFilter &&
        minFilter !== NearestMipMapLinearFilter &&
        minFilter !== NearestMipMapNearestFilter) {
        this.error(`[createTexture] Unsupported value for 'minFilter' - 
        supported values are LinearFilter, LinearMipMapNearestFilter, NearestMipMapNearestFilter, 
        NearestMipMapLinearFilter and LinearMipmapLinearFilter. Defaulting to LinearMipmapLinearFilter.`);
        minFilter = LinearMipmapLinearFilter;
    }
    let magFilter = cfg.magFilter || LinearFilter;
    if (magFilter !== LinearFilter && magFilter !== NearestFilter) {
        this.error(`[createTexture] Unsupported value for 'magFilter' - supported values are LinearFilter and NearestFilter. Defaulting to LinearFilter.`);
        magFilter = LinearFilter;
    }
    let wrapS = cfg.wrapS || RepeatWrapping;
    if (wrapS !== ClampToEdgeWrapping && wrapS !== MirroredRepeatWrapping && wrapS !== RepeatWrapping) {
        this.error(`[createTexture] Unsupported value for 'wrapS' - supported values are ClampToEdgeWrapping, MirroredRepeatWrapping and RepeatWrapping. Defaulting to RepeatWrapping.`);
        wrapS = RepeatWrapping;
    }
    let wrapT = cfg.wrapT || RepeatWrapping;
    if (wrapT !== ClampToEdgeWrapping && wrapT !== MirroredRepeatWrapping && wrapT !== RepeatWrapping) {
        this.error(`[createTexture] Unsupported value for 'wrapT' - supported values are ClampToEdgeWrapping, MirroredRepeatWrapping and RepeatWrapping. Defaulting to RepeatWrapping.`);
        wrapT = RepeatWrapping;
    }
    let wrapR = cfg.wrapR || RepeatWrapping;
    if (wrapR !== ClampToEdgeWrapping && wrapR !== MirroredRepeatWrapping && wrapR !== RepeatWrapping) {
        this.error(`[createTexture] Unsupported value for 'wrapR' - supported values are ClampToEdgeWrapping, MirroredRepeatWrapping and RepeatWrapping. Defaulting to RepeatWrapping.`);
        wrapR = RepeatWrapping;
    }
    let encoding = cfg.encoding || LinearEncoding;
    if (encoding !== LinearEncoding && encoding !== sRGBEncoding) {
        this.error("[createTexture] Unsupported value for 'encoding' - supported values are LinearEncoding and sRGBEncoding. Defaulting to LinearEncoding.");
        encoding = LinearEncoding;
    }
    const texture = new Texture2D({
        gl: this.scene.canvas.gl,
        minFilter,
        magFilter,
        wrapS,
        wrapT,
        wrapR,
        // flipY: cfg.flipY,
        encoding
    });
    if (cfg.preloadColor) {
        texture.setPreloadColor(cfg.preloadColor);
    }
    if (cfg.image) { // Ignore transcoder for Images
        const image = cfg.image;
        image.crossOrigin = "Anonymous";
        texture.setImage(image, {minFilter, magFilter, wrapS, wrapT, wrapR, flipY: cfg.flipY, encoding});
    } else if (cfg.src) {
        const ext = cfg.src.split('.').pop();
        switch (ext) { // Don't transcode recognized image file types
            case "jpeg":
            case "jpg":
            case "png":
            case "gif":
                const image = new Image();
                image.onload = () => {
                    texture.setImage(image, {
                        minFilter,
                        magFilter,
                        wrapS,
                        wrapT,
                        wrapR,
                        flipY: cfg.flipY,
                        encoding
                    });
                    this.glRedraw();
                };
                image.src = cfg.src; // URL or Base64 string
                break;
            default: // Assume other file types need transcoding
                if (!this._textureTranscoder) {
                    this.error(`[createTexture] Can't create texture from 'src' - SceneModel needs to be configured with a TextureTranscoder for this file type ('${ext}')`);
                } else {
                    utils.loadArraybuffer(cfg.src, (arrayBuffer) => {
                            if (!arrayBuffer.byteLength) {
                                this.error(`[createTexture] Can't create texture from 'src': file data is zero length`);
                                return;
                            }
                            this._textureTranscoder.transcode([arrayBuffer], texture).then(() => {
                                this.glRedraw();
                            });
                        },
                        function (errMsg) {
                            this.error(`[createTexture] Can't create texture from 'src': ${errMsg}`);
                        });
                }
                break;
        }
    } else if (cfg.buffers) { // Buffers implicitly require transcoding
        if (!this._textureTranscoder) {
            this.error(`[createTexture] Can't create texture from 'buffers' - SceneModel needs to be configured with a TextureTranscoder for this option`);
        } else {
            this._textureTranscoder.transcode(cfg.buffers, texture).then(() => {
                this.glRedraw();
            });
        }
    }
    this._textures[textureId] = new SceneModelTexture({id: textureId, texture});
}
