class Texture extends Component {

    /**
     @private
     */
    get type() {
        return "Texture";
    }

    /**
     * @constructor
     * @param {Component} owner Owner component. When destroyed, the owner will destroy this Texture as well.
     * @param {*} [cfg] Configs
     * @param {String} [cfg.id] Optional ID for this Texture, unique among all components in the parent scene, generated automatically when omitted.
     * @param {String} [cfg.src=null] Path to image file to load into this Texture. See the {@link Texture#src} property for more info.
     * @param {HTMLImageElement} [cfg.image=null] HTML Image object to load into this Texture. See the {@link Texture#image} property for more info.
     * @param {Number} [cfg.minFilter=LinearMipmapLinearFilter] How the texture is sampled when a texel covers less than one pixel.
     * Supported values are {@link LinearMipmapLinearFilter}, {@link LinearMipMapNearestFilter}, {@link NearestMipMapNearestFilter}, {@link NearestMipMapLinearFilter} and {@link LinearMipMapLinearFilter}.
     * @param {Number} [cfg.magFilter=LinearFilter] How the texture is sampled when a texel covers more than one pixel. Supported values are {@link LinearFilter} and {@link NearestFilter}.
     * @param {Number} [cfg.wrapS=RepeatWrapping] Wrap parameter for texture coordinate *S*. Supported values are {@link ClampToEdgeWrapping}, {@link MirroredRepeatWrapping} and {@link RepeatWrapping}.
     * @param {Number} [cfg.wrapT=RepeatWrapping] Wrap parameter for texture coordinate *T*. Supported values are {@link ClampToEdgeWrapping}, {@link MirroredRepeatWrapping} and {@link RepeatWrapping}..
     * @param {Boolean} [cfg.flipY=false] Flips this Texture's source data along its vertical axis when ````true````.
     * @param  {Number} [cfg.encoding=LinearEncoding] Encoding format. Supported values are {@link LinearEncoding} and {@link sRGBEncoding}.
     * @param {Number[]} [cfg.translate=[0,0]] 2D translation vector that will be added to texture's *S* and *T* coordinates.
     * @param {Number[]} [cfg.scale=[1,1]] 2D scaling vector that will be applied to texture's *S* and *T* coordinates.
     * @param {Number} [cfg.rotate=0] Rotation, in degrees, that will be applied to texture's *S* and *T* coordinates.
     */
    constructor(owner, cfg = {}) {

        super(owner, cfg);

        this._state = new RenderState({
            texture: new Texture2D({gl: this.scene.canvas.gl}),
            matrix: math.identityMat4(),
            hasMatrix: (cfg.translate && (cfg.translate[0] !== 0 || cfg.translate[1] !== 0)) || (!!cfg.rotate) || (cfg.scale && (cfg.scale[0] !== 0 || cfg.scale[1] !== 0)),
            minFilter: this._checkMinFilter(cfg.minFilter),
            magFilter: this._checkMagFilter(cfg.magFilter),
            wrapS: this._checkWrapS(cfg.wrapS),
            wrapT: this._checkWrapT(cfg.wrapT),
            flipY: this._checkFlipY(cfg.flipY),
            encoding: this._checkEncoding(cfg.encoding)
        });

        // Data source

        this._src = null;
        this._image = null;

        // Transformation

        this._translate = math.vec2([0, 0]);
        this._scale = math.vec2([1, 1]);
        this._rotate = math.vec2([0, 0]);

        this._matrixDirty = false;

        // Transform

        this.translate = cfg.translate;
        this.scale = cfg.scale;
        this.rotate = cfg.rotate;

        // Data source

        if (cfg.src) {
            this.src = cfg.src; // Image file
        } else if (cfg.image) {
            this.image = cfg.image; // Image object
        }

        stats.memory.textures++;
    }

    _checkMinFilter(value) {
        value = value || LinearMipMapLinearFilter;
        if (value !== LinearFilter &&
            value !== LinearMipMapNearestFilter &&
            value !== LinearMipMapLinearFilter &&
            value !== NearestMipMapLinearFilter &&
            value !== NearestMipMapNearestFilter) {
            this.error("Unsupported value for 'minFilter' - supported values are LinearFilter, LinearMipMapNearestFilter, NearestMipMapNearestFilter, " +
                "NearestMipMapLinearFilter and LinearMipMapLinearFilter. Defaulting to LinearMipMapLinearFilter.");
            value = LinearMipMapLinearFilter;
        }
        return value;
    }

    _checkMagFilter(value) {
        value = value || LinearFilter;
        if (value !== LinearFilter && value !== NearestFilter) {
            this.error("Unsupported value for 'magFilter' - supported values are LinearFilter and NearestFilter. Defaulting to LinearFilter.");
            value = LinearFilter;
        }
        return value;
    }

    _checkWrapS(value) {
        value = value || RepeatWrapping;
        if (value !== ClampToEdgeWrapping && value !== MirroredRepeatWrapping && value !== RepeatWrapping) {
            this.error("Unsupported value for 'wrapS' - supported values are ClampToEdgeWrapping, MirroredRepeatWrapping and RepeatWrapping. Defaulting to RepeatWrapping.");
            value = RepeatWrapping;
        }
        return value;
    }

    _checkWrapT(value) {
        value = value || RepeatWrapping;
        if (value !== ClampToEdgeWrapping && value !== MirroredRepeatWrapping && value !== RepeatWrapping) {
            this.error("Unsupported value for 'wrapT' - supported values are ClampToEdgeWrapping, MirroredRepeatWrapping and RepeatWrapping. Defaulting to RepeatWrapping.");
            value = RepeatWrapping;
        }
        return value;
    }

    _checkFlipY(value) {
        return !!value;
    }

    _checkEncoding(value) {
        value = value || LinearEncoding;
        if (value !== LinearEncoding && value !== sRGBEncoding) {
            this.error("Unsupported value for 'encoding' - supported values are LinearEncoding and sRGBEncoding. Defaulting to LinearEncoding.");
            value = LinearEncoding;
        }
        return value;
    }

    _webglContextRestored() {
        this._state.texture = new Texture2D({gl: this.scene.canvas.gl});
        if (this._image) {
            this.image = this._image;
        } else if (this._src) {
            this.src = this._src;
        }
    }

    _update() {
        const state = this._state;
        if (this._matrixDirty) {
            let matrix;
            let t;
            if (this._translate[0] !== 0 || this._translate[1] !== 0) {
                matrix = math.translationMat4v([this._translate[0], this._translate[1], 0], this._state.matrix);
            }
            if (this._scale[0] !== 1 || this._scale[1] !== 1) {
                t = math.scalingMat4v([this._scale[0], this._scale[1], 1]);
                matrix = matrix ? math.mulMat4(matrix, t) : t;
            }
            if (this._rotate !== 0) {
                t = math.rotationMat4v(this._rotate * 0.0174532925, [0, 0, 1]);
                matrix = matrix ? math.mulMat4(matrix, t) : t;
            }
            if (matrix) {
                state.matrix = matrix;
            }
            this._matrixDirty = false;
        }
        this.glRedraw();
    }


    /**
     * Sets an HTML DOM Image object to source this Texture from.
     *
     * Sets {@link Texture#src} null.
     *
     * @type {HTMLImageElement}
     */
    set image(value) {
        this._image = ensureImageSizePowerOfTwo(value);
        this._image.crossOrigin = "Anonymous";
        this._state.texture.setImage(this._image, this._state);
        this._src = null;
        this.glRedraw();
    }

    /**
     * Gets HTML DOM Image object this Texture is sourced from, if any.
     *
     * Returns null if not set.
     *
     * @type {HTMLImageElement}
     */
    get image() {
        return this._image;
    }

    /**
     * Sets path to an image file to source this Texture from.
     *
     * Sets {@link Texture#image} null.
     *
     * @type {String}
     */
    set src(src) {
        this.scene.loading++;
        this.scene.canvas.spinner.processes++;
        const self = this;
        let image = new Image();
        image.onload = function () {
            image = ensureImageSizePowerOfTwo(image);
            self._state.texture.setImage(image, self._state);
            self.scene.loading--;
            self.glRedraw();
            self.scene.canvas.spinner.processes--;
        };
        image.src = src;
        this._src = src;
        this._image = null;
    }

    /**
     * Gets path to the image file this Texture from, if any.
     *
     * Returns null if not set.
     *
     * @type {String}
     */
    get src() {
        return this._src;
    }

    /**
     * Sets the 2D translation vector added to this Texture's *S* and *T* UV coordinates.
     *
     * Default value is ````[0, 0]````.
     *
     * @type {Number[]}
     */
    set translate(value) {
        this._translate.set(value || [0, 0]);
        this._matrixDirty = true;
        this._needUpdate();
    }

    /**
     * Gets the 2D translation vector added to this Texture's *S* and *T* UV coordinates.
     *
     * Default value is ````[0, 0]````.
     *
     * @type {Number[]}
     */
    get translate() {
        return this._translate;
    }

    /**
     * Sets the 2D scaling vector that will be applied to this Texture's *S* and *T* UV coordinates.
     *
     * Default value is ````[1, 1]````.
     *
     * @type {Number[]}
     */
    set scale(value) {
        this._scale.set(value || [1, 1]);
        this._matrixDirty = true;
        this._needUpdate();
    }

    /**
     * Gets the 2D scaling vector that will be applied to this Texture's *S* and *T* UV coordinates.
     *
     * Default value is ````[1, 1]````.
     *
     * @type {Number[]}
     */
    get scale() {
        return this._scale;
    }

    /**
     * Sets the rotation angles, in degrees, that will be applied to this Texture's *S* and *T* UV coordinates.
     *
     * Default value is ````0````.
     *
     * @type {Number}
     */
    set rotate(value) {
        value = value || 0;
        if (this._rotate === value) {
            return;
        }
        this._rotate = value;
        this._matrixDirty = true;
        this._needUpdate();
    }

    /**
     * Gets the rotation angles, in degrees, that will be applied to this Texture's *S* and *T* UV coordinates.
     *
     * Default value is ````0````.
     *
     * @type {Number}
     */
    get rotate() {
        return this._rotate;
    }

    /**
     * Gets how this Texture is sampled when a texel covers less than one pixel.
     *
     * Options are:
     *
     * * NearestFilter - Uses the value of the texture element that is nearest
     * (in Manhattan distance) to the center of the pixel being textured.
     *
     * * LinearFilter - Uses the weighted average of the four texture elements that are
     * closest to the center of the pixel being textured.
     *
     * * NearestMipMapNearestFilter - Chooses the mipmap that most closely matches the
     * size of the pixel being textured and uses the "nearest" criterion (the texture
     * element nearest to the center of the pixel) to produce a texture value.
     *
     * * LinearMipMapNearestFilter - Chooses the mipmap that most closely matches the size of
     * the pixel being textured and uses the "linear" criterion (a weighted average of the
     * four texture elements that are closest to the center of the pixel) to produce a
     * texture value.
     *
     * * NearestMipMapLinearFilter - Chooses the two mipmaps that most closely
     * match the size of the pixel being textured and uses the "nearest" criterion
     * (the texture element nearest to the center of the pixel) to produce a texture
     * value from each mipmap. The final texture value is a weighted average of those two
     * values.
     *
     * * LinearMipMapLinearFilter - (default) - Chooses the two mipmaps that most closely match the size
     * of the pixel being textured and uses the "linear" criterion (a weighted average
     * of the four texture elements that are closest to the center of the pixel) to
     * produce a texture value from each mipmap. The final texture value is a weighted
     * average of those two values.
     *
     * Default value is LinearMipMapLinearFilter.
     *
     *  @type {Number}
     */
    get minFilter() {
        return this._state.minFilter;
    }

    /**
     * Gets how this Texture is sampled when a texel covers more than one pixel.
     *
     * * NearestFilter - Uses the value of the texture element that is nearest
     * (in Manhattan distance) to the center of the pixel being textured.
     * * LinearFilter - (default) - Uses the weighted average of the four texture elements that are
     * closest to the center of the pixel being textured.
     *
     * Default value is LinearMipMapLinearFilter.
     *
     * @type {Number}
     */
    get magFilter() {
        return this._state.magFilter;
    }

    /**
     * Gets the wrap parameter for this Texture's *S* coordinate.
     *
     * Values can be:
     *
     * * ClampToEdgeWrapping -  causes *S* coordinates to be clamped to the size of the texture.
     * * MirroredRepeatWrapping - causes the *S* coordinate to be set to the fractional part of the texture coordinate
     * if the integer part of *S* is even; if the integer part of *S* is odd, then the *S* texture coordinate is
     * set to *1 - frac ⁡ S* , where *frac ⁡ S* represents the fractional part of *S*.
     * * RepeatWrapping - (default) - causes the integer part of the *S* coordinate to be ignored; xeokit uses only the
     * fractional part, thereby creating a repeating pattern.
     *
     * Default value is RepeatWrapping.
     *
     * @type {Number}
     */
    get wrapS() {
        return this._state.wrapS;
    }

    /**
     * Gets the wrap parameter for this Texture's *T* coordinate.
     *
     * Values can be:
     *
     * * ClampToEdgeWrapping -  causes *S* coordinates to be clamped to the size of the texture.
     *  * MirroredRepeatWrapping - causes the *S* coordinate to be set to the fractional part of the texture coordinate
     * if the integer part of *S* is even; if the integer part of *S* is odd, then the *S* texture coordinate is
     * set to *1 - frac ⁡ S* , where *frac ⁡ S* represents the fractional part of *S*.
     * * RepeatWrapping - (default) - causes the integer part of the *S* coordinate to be ignored; xeokit uses only the
     * fractional part, thereby creating a repeating pattern.
     *
     * Default value is RepeatWrapping.
     *
     * @type {Number}
     */
    get wrapT() {
        return this._state.wrapT;
    }

    /**
     * Gets if this Texture's source data is flipped along its vertical axis.
     *
     * @type {Number}
     */
    get flipY() {
        return this._state.flipY;
    }

    /**
     * Gets the Texture's encoding format.
     *
     * @type {Number}
     */
    get encoding() {
        return this._state.encoding;
    }

    /**
     * Destroys this Texture
     */
    destroy() {
        super.destroy();
        if (this._state.texture) {
            this._state.texture.destroy();
        }
        this._state.destroy();
        stats.memory.textures--;
    }
}
