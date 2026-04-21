class EdgeMaterial extends Material {

    /**
     @private
     */
    get type() {
        return "EdgeMaterial";
    }

    /**
     * Gets available EdgeMaterial presets.
     *
     * @type {Object}
     */
    get presets() {
        return PRESETS;
    };

    /**
     * @constructor
     * @param {Component} owner Owner component. When destroyed, the owner will destroy this component as well.
     * @param {*} [cfg] The EdgeMaterial configuration
     * @param {String} [cfg.id] Optional ID, unique among all components in the parent {@link Scene}, generated automatically when omitted.
     * @param {Number[]} [cfg.edgeColor=[0.2,0.2,0.2]] RGB edge color.
     * @param {Number} [cfg.edgeAlpha=1.0] Edge transparency. A value of ````0.0```` indicates fully transparent, ````1.0```` is fully opaque.
     * @param {Number} [cfg.edgeWidth=1] Edge width in pixels.
     * @param {String} [cfg.preset] Selects a preset EdgeMaterial configuration - see {@link EdgeMaterial#presets}.
     */
    constructor(owner, cfg = {}) {

        super(owner, cfg);

        this._state = new RenderState({
            type: "EdgeMaterial",
            edges: null,
            edgeColor: null,
            edgeAlpha: null,
            edgeWidth: null
        });

        this._preset = "default";

        if (cfg.preset) { // Apply preset then override with configs where provided
            this.preset = cfg.preset;
            if (cfg.edgeColor) {
                this.edgeColor = cfg.edgeColor;
            }
            if (cfg.edgeAlpha !== undefined) {
                this.edgeAlpha = cfg.edgeAlpha;
            }
            if (cfg.edgeWidth !== undefined) {
                this.edgeWidth = cfg.edgeWidth;
            }
        } else {
            this.edgeColor = cfg.edgeColor;
            this.edgeAlpha = cfg.edgeAlpha;
            this.edgeWidth = cfg.edgeWidth;
        }
        this.edges = (cfg.edges !== false);
    }


    /**
     * Sets if edges are visible.
     *
     * Default is ````true````.
     *
     * @type {Boolean}
     */
    set edges(value) {
        value = value !== false;
        if (this._state.edges === value) {
            return;
        }
        this._state.edges = value;
        this.glRedraw();
    }

    /**
     * Gets if edges are visible.
     *
     * Default is ````true````.
     *
     * @type {Boolean}
     */
    get edges() {
        return this._state.edges;
    }

    /**
     * Sets RGB edge color.
     *
     * Default value is ````[0.2, 0.2, 0.2]````.
     *
     * @type {Number[]}
     */
    set edgeColor(value) {
        let edgeColor = this._state.edgeColor;
        if (!edgeColor) {
            edgeColor = this._state.edgeColor = new Float32Array(3);
        } else if (value && edgeColor[0] === value[0] && edgeColor[1] === value[1] && edgeColor[2] === value[2]) {
            return;
        }
        if (value) {
            edgeColor[0] = value[0];
            edgeColor[1] = value[1];
            edgeColor[2] = value[2];
        } else {
            edgeColor[0] = 0.2;
            edgeColor[1] = 0.2;
            edgeColor[2] = 0.2;
        }
        this.glRedraw();
    }

    /**
     * Gets RGB edge color.
     *
     * Default value is ````[0.2, 0.2, 0.2]````.
     *
     * @type {Number[]}
     */
    get edgeColor() {
        return this._state.edgeColor;
    }

    /**
     * Sets edge transparency.
     *
     * A value of ````0.0```` indicates fully transparent, ````1.0```` is fully opaque.
     *
     * Default value is ````1.0````.
     *
     * @type {Number}
     */
    set edgeAlpha(value) {
        value = (value !== undefined && value !== null) ? value : 1.0;
        if (this._state.edgeAlpha === value) {
            return;
        }
        this._state.edgeAlpha = value;
        this.glRedraw();
    }

    /**
     * Gets edge transparency.
     *
     * A value of ````0.0```` indicates fully transparent, ````1.0```` is fully opaque.
     *
     * Default value is ````1.0````.
     *
     * @type {Number}
     */
    get edgeAlpha() {
        return this._state.edgeAlpha;
    }

    /**
     * Sets edge width.
     *
     * This is not supported by WebGL implementations based on DirectX [2019].
     *
     * Default value is ````1.0```` pixels.
     *
     * @type {Number}
     */
    set edgeWidth(value) {
        this._state.edgeWidth = value || 1.0;
        this.glRedraw();
    }

    /**
     * Gets edge width.
     *
     * This is not supported by WebGL implementations based on DirectX [2019].
     *
     * Default value is ````1.0```` pixels.
     *
     * @type {Number}
     */
    get edgeWidth() {
        return this._state.edgeWidth;
    }

    /**
     * Selects a preset EdgeMaterial configuration.
     *
     * Default value is ````"default"````.
     *
     * @type {String}
     */
    set preset(value) {
        value = value || "default";
        if (this._preset === value) {
            return;
        }
        const preset = PRESETS[value];
        if (!preset) {
            this.error("unsupported preset: '" + value + "' - supported values are " + Object.keys(PRESETS).join(", "));
            return;
        }
        this.edgeColor = preset.edgeColor;
        this.edgeAlpha = preset.edgeAlpha;
        this.edgeWidth = preset.edgeWidth;
        this._preset = value;
    }

    /**
     * The current preset EdgeMaterial configuration.
     *
     * Default value is ````"default"````.
     *
     * @type {String}
     */
    get preset() {
        return this._preset;
    }

    /**
     * Destroys this EdgeMaterial.
     */
    destroy() {
        super.destroy();
        this._state.destroy();
    }
}
