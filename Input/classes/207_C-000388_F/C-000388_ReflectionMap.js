class ReflectionMap extends CubeTexture {

    /**
     @private
     */
    get type() {
        return "ReflectionMap";
    }

    /**
     * @param {Component} owner Owner component. When destroyed, the owner will destroy this component as well.
     * @param {*} [cfg] Configs
     * @param {String} [cfg.id] Optional ID for this ReflectionMap, unique among all components in the parent scene, generated automatically when omitted.
     * @param {String[]} [cfg.src=null]  Paths to six image files to load into this ReflectionMap.
     * @param {Boolean} [cfg.flipY=false] Flips this ReflectionMap's source data along its vertical axis when true.
     * @param {Number} [cfg.encoding=LinearEncoding] Encoding format. Supported values are {@link LinearEncoding} and {@link sRGBEncoding}.
     */
    constructor(owner, cfg = {}) {
        super(owner, cfg);
        this.scene._lightsState.addReflectionMap(this._state);
        this.scene._reflectionMapCreated(this);
    }

    /**
     * Destroys this ReflectionMap.
     */
    destroy() {
        super.destroy();
        this.scene._reflectionMapDestroyed(this);
    }
}
