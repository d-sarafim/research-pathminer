constructor(owner, cfg = {}) {

    super(owner, cfg);

    /**
     * ID of the corresponding object within the originating system, if any.
     *
     * @type {String}
     * @abstract
     */
    this.originalSystemId = (cfg.originalSystemId || this.id);

    /** @private **/
    this.renderFlags = new RenderFlags();

    this._state = new RenderState({ // NOTE: Renderer gets modeling and normal matrices from Mesh#matrix and Mesh.#normalWorldMatrix
        visible: true,
        culled: false,
        pickable: null,
        clippable: null,
        collidable: null,
        occluder: (cfg.occluder !== false),
        castsShadow: null,
        receivesShadow: null,
        xrayed: false,
        highlighted: false,
        selected: false,
        edges: false,
        stationary: !!cfg.stationary,
        background: !!cfg.background,
        billboard: this._checkBillboard(cfg.billboard),
        layer: null,
        colorize: null,
        pickID: this.scene._renderer.getPickID(this),
        drawHash: "",
        pickHash: "",
        offset: math.vec3(),
        origin: null,
        originHash: null
    });

    this._drawRenderer = null;
    this._shadowRenderer = null;
    this._emphasisFillRenderer = null;
    this._emphasisEdgesRenderer = null;
    this._pickMeshRenderer = null;
    this._pickTriangleRenderer = null;
    this._occlusionRenderer = null;

    this._geometry = cfg.geometry ? this._checkComponent2(["ReadableGeometry", "VBOGeometry"], cfg.geometry) : this.scene.geometry;
    this._material = cfg.material ? this._checkComponent2(["PhongMaterial", "MetallicMaterial", "SpecularMaterial", "LambertMaterial"], cfg.material) : this.scene.material;
    this._xrayMaterial = cfg.xrayMaterial ? this._checkComponent("EmphasisMaterial", cfg.xrayMaterial) : this.scene.xrayMaterial;
    this._highlightMaterial = cfg.highlightMaterial ? this._checkComponent("EmphasisMaterial", cfg.highlightMaterial) : this.scene.highlightMaterial;
    this._selectedMaterial = cfg.selectedMaterial ? this._checkComponent("EmphasisMaterial", cfg.selectedMaterial) : this.scene.selectedMaterial;
    this._edgeMaterial = cfg.edgeMaterial ? this._checkComponent("EdgeMaterial", cfg.edgeMaterial) : this.scene.edgeMaterial;

    this._parentNode = null;

    this._aabb = null;
    this._aabbDirty = true;

    this._numTriangles = (this._geometry ? this._geometry.numTriangles : 0);

    this.scene._aabbDirty = true;

    this._scale = math.vec3();
    this._quaternion = math.identityQuaternion();
    this._rotation = math.vec3();
    this._position = math.vec3();

    this._worldMatrix = math.identityMat4();
    this._worldNormalMatrix = math.identityMat4();

    this._localMatrixDirty = true;
    this._worldMatrixDirty = true;
    this._worldNormalMatrixDirty = true;

    const origin = cfg.origin || cfg.rtcCenter;
    if (origin) {
        this._state.origin = math.vec3(origin);
        this._state.originHash = origin.join();
    }

    if (cfg.matrix) {
        this.matrix = cfg.matrix;
    } else {
        this.scale = cfg.scale;
        this.position = cfg.position;
        if (cfg.quaternion) {
        } else {
            this.rotation = cfg.rotation;
        }
    }

    this._isObject = cfg.isObject;
    if (this._isObject) {
        this.scene._registerObject(this);
    }

    this._isModel = cfg.isModel;
    if (this._isModel) {
        this.scene._registerModel(this);
    }

    this.visible = cfg.visible;
    this.culled = cfg.culled;
    this.pickable = cfg.pickable;
    this.clippable = cfg.clippable;
    this.collidable = cfg.collidable;
    this.castsShadow = cfg.castsShadow;
    this.receivesShadow = cfg.receivesShadow;
    this.xrayed = cfg.xrayed;
    this.highlighted = cfg.highlighted;
    this.selected = cfg.selected;
    this.edges = cfg.edges;
    this.layer = cfg.layer;
    this.colorize = cfg.colorize;
    this.opacity = cfg.opacity;
    this.offset = cfg.offset;

    if (cfg.parentId) {
        const parentNode = this.scene.components[cfg.parentId];
        if (!parentNode) {
            this.error("Parent not found: '" + cfg.parentId + "'");
        } else if (!parentNode.isNode) {
            this.error("Parent is not a Node: '" + cfg.parentId + "'");
        } else {
            parentNode.addChild(this);
        }
        this._parentNode = parentNode;
    } else if (cfg.parent) {
        if (!cfg.parent.isNode) {
            this.error("Parent is not a Node");
        }
        cfg.parent.addChild(this);
        this._parentNode = cfg.parent;
    }

    this.compile();
}
