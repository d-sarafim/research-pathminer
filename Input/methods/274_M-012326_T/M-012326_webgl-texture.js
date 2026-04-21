upload(device, texture) {

    Debug.assert(texture.device, "Attempting to use a texture that has been destroyed.", texture);
    const gl = device.gl;

    if (!texture._needsUpload && ((texture._needsMipmapsUpload && texture._mipmapsUploaded) || !texture.pot))
        return;

    let mipLevel = 0;
    let mipObject;
    let resMult;

    const requiredMipLevels = texture.requiredMipLevels;

    // Upload all existing mip levels. Initialize 0 mip anyway.
    while (texture._levels[mipLevel] || mipLevel === 0) {

        if (!texture._needsUpload && mipLevel === 0) {
            mipLevel++;
            continue;
        } else if (mipLevel && (!texture._needsMipmapsUpload || !texture._mipmaps)) {
            break;
        }

        mipObject = texture._levels[mipLevel];

        if (mipLevel === 1 && !texture._compressed && texture._levels.length < requiredMipLevels) {
            // We have more than one mip levels we want to assign, but we need all mips to make
            // the texture complete. Therefore first generate all mip chain from 0, then assign custom mips.
            // (this implies the call to _completePartialMipLevels above was unsuccessful)
            gl.generateMipmap(this._glTarget);
            texture._mipmapsUploaded = true;
        }

        if (texture._cubemap) {
            // ----- CUBEMAP -----
            let face;

            if (device._isBrowserInterface(mipObject[0])) {
                // Upload the image, canvas or video
                for (face = 0; face < 6; face++) {
                    if (!texture._levelsUpdated[0][face])
                        continue;

                    let src = mipObject[face];
                    // Downsize images that are too large to be used as cube maps
                    if (device._isImageBrowserInterface(src)) {
                        if (src.width > device.maxCubeMapSize || src.height > device.maxCubeMapSize) {
                            src = downsampleImage(src, device.maxCubeMapSize);
                            if (mipLevel === 0) {
                                texture._width = src.width;
                                texture._height = src.height;
                            }
                        }
                    }

                    device.setUnpackFlipY(false);
                    device.setUnpackPremultiplyAlpha(texture._premultiplyAlpha);
                    gl.texImage2D(
                        gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
                        mipLevel,
                        this._glInternalFormat,
                        this._glFormat,
                        this._glPixelType,
                        src
                    );
                }
            } else {
                // Upload the byte array
                resMult = 1 / Math.pow(2, mipLevel);
                for (face = 0; face < 6; face++) {
                    if (!texture._levelsUpdated[0][face])
                        continue;

                    const texData = mipObject[face];
                    if (texture._compressed) {
                        gl.compressedTexImage2D(
                            gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
                            mipLevel,
                            this._glInternalFormat,
                            Math.max(texture._width * resMult, 1),
                            Math.max(texture._height * resMult, 1),
                            0,
                            texData
                        );
                    } else {
                        device.setUnpackFlipY(false);
                        device.setUnpackPremultiplyAlpha(texture._premultiplyAlpha);
                        gl.texImage2D(
                            gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
                            mipLevel,
                            this._glInternalFormat,
                            Math.max(texture._width * resMult, 1),
                            Math.max(texture._height * resMult, 1),
                            0,
                            this._glFormat,
                            this._glPixelType,
                            texData
                        );
                    }
                }
            }
        } else if (texture._volume) {
            // ----- 3D -----
            // Image/canvas/video not supported (yet?)
            // Upload the byte array
            resMult = 1 / Math.pow(2, mipLevel);
            if (texture._compressed) {
                gl.compressedTexImage3D(gl.TEXTURE_3D,
                                        mipLevel,
                                        this._glInternalFormat,
                                        Math.max(texture._width * resMult, 1),
                                        Math.max(texture._height * resMult, 1),
                                        Math.max(texture._depth * resMult, 1),
                                        0,
                                        mipObject);
            } else {
                device.setUnpackFlipY(false);
                device.setUnpackPremultiplyAlpha(texture._premultiplyAlpha);
                gl.texImage3D(gl.TEXTURE_3D,
                              mipLevel,
                              this._glInternalFormat,
                              Math.max(texture._width * resMult, 1),
                              Math.max(texture._height * resMult, 1),
                              Math.max(texture._depth * resMult, 1),
                              0,
                              this._glFormat,
                              this._glPixelType,
                              mipObject);
            }
        } else {
            // ----- 2D -----
            if (device._isBrowserInterface(mipObject)) {
                // Downsize images that are too large to be used as textures
                if (device._isImageBrowserInterface(mipObject)) {
                    if (mipObject.width > device.maxTextureSize || mipObject.height > device.maxTextureSize) {
                        mipObject = downsampleImage(mipObject, device.maxTextureSize);
                        if (mipLevel === 0) {
                            texture._width = mipObject.width;
                            texture._height = mipObject.height;
                        }
                    }
                }

                // Upload the image, canvas or video
                device.setUnpackFlipY(texture._flipY);
                device.setUnpackPremultiplyAlpha(texture._premultiplyAlpha);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    mipLevel,
                    this._glInternalFormat,
                    this._glFormat,
                    this._glPixelType,
                    mipObject
                );
            } else {
                // Upload the byte array
                resMult = 1 / Math.pow(2, mipLevel);
                if (texture._compressed) {
                    gl.compressedTexImage2D(
                        gl.TEXTURE_2D,
                        mipLevel,
                        this._glInternalFormat,
                        Math.max(Math.floor(texture._width * resMult), 1),
                        Math.max(Math.floor(texture._height * resMult), 1),
                        0,
                        mipObject
                    );
                } else {
                    device.setUnpackFlipY(false);
                    device.setUnpackPremultiplyAlpha(texture._premultiplyAlpha);
                    gl.texImage2D(
                        gl.TEXTURE_2D,
                        mipLevel,
                        this._glInternalFormat,
                        Math.max(texture._width * resMult, 1),
                        Math.max(texture._height * resMult, 1),
                        0,
                        this._glFormat,
                        this._glPixelType,
                        mipObject
                    );
                }
            }

            if (mipLevel === 0) {
                texture._mipmapsUploaded = false;
            } else {
                texture._mipmapsUploaded = true;
            }
        }
        mipLevel++;
    }

    if (texture._needsUpload) {
        if (texture._cubemap) {
            for (let i = 0; i < 6; i++)
                texture._levelsUpdated[0][i] = false;
        } else {
            texture._levelsUpdated[0] = false;
        }
    }

    if (!texture._compressed && texture._mipmaps && texture._needsMipmapsUpload && (texture.pot || device.webgl2) && texture._levels.length === 1) {
        gl.generateMipmap(this._glTarget);
        texture._mipmapsUploaded = true;
    }

    // update vram stats
    if (texture._gpuSize) {
        texture.adjustVramSizeTracking(device._vram, -texture._gpuSize);
    }

    texture._gpuSize = texture.gpuSize;
    texture.adjustVramSizeTracking(device._vram, texture._gpuSize);
}
