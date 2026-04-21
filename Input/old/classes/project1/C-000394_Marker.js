class Marker extends Component {

    /**
     * @constructor
     * @param {Component} [owner]  Owner component. When destroyed, the owner will destroy this Marker as well.
     * @param {*} [cfg]  Marker configuration
     * @param {String} [cfg.id] Optional ID, unique among all components in the parent {@link Scene}, generated automatically when omitted.
     * @param {Entity} [cfg.entity] Entity to associate this Marker with. When the Marker has an Entity, then {@link Marker#visible} will always be ````false```` if {@link Entity#visible} is false.
     * @param {Boolean} [cfg.occludable=false] Indicates whether or not this Marker is hidden (ie. {@link Marker#visible} is ````false```` whenever occluded by {@link Entity}s in the {@link Scene}.
     * @param {Number[]} [cfg.worldPos=[0,0,0]] World-space 3D Marker position.
     */
    constructor(owner, cfg) {

        super(owner, cfg);

        this._entity = null;
        this._visible = null;
        this._worldPos = math.vec3();
        this._origin = math.vec3();
        this._rtcPos = math.vec3();
        this._viewPos = math.vec3();
        this._canvasPos = math.vec2();
        this._occludable = false;

        this._onCameraViewMatrix = this.scene.camera.on("matrix", () => {
            this._viewPosDirty = true;
            this._needUpdate();
        });

        this._onCameraProjMatrix = this.scene.camera.on("projMatrix", () => {
            this._canvasPosDirty = true;
            this._needUpdate();
        });

        this._onEntityDestroyed = null;
        this._onEntityModelDestroyed = null;

        this._renderer.addMarker(this);

        this.entity = cfg.entity;
        this.worldPos = cfg.worldPos;
        this.occludable = cfg.occludable;
    }

    _update() { // this._needUpdate() schedules this for next tick
        if (this._viewPosDirty) {
            math.transformPoint3(this.scene.camera.viewMatrix, this._worldPos, this._viewPos);
            this._viewPosDirty = false;
            this._canvasPosDirty = true;
            this.fire("viewPos", this._viewPos);
        }
        if (this._canvasPosDirty) {
            tempVec4a.set(this._viewPos);
            tempVec4a[3] = 1.0;
            math.transformPoint4(this.scene.camera.projMatrix, tempVec4a, tempVec4b);
            const aabb = this.scene.canvas.boundary;
            this._canvasPos[0] = Math.floor((1 + tempVec4b[0] / tempVec4b[3]) * aabb[2] / 2);
            this._canvasPos[1] = Math.floor((1 - tempVec4b[1] / tempVec4b[3]) * aabb[3] / 2);
            this._canvasPosDirty = false;
            this.fire("canvasPos", this._canvasPos);
        }
    }

    _setVisible(visible) { // Called by VisibilityTester and this._entity.on("destroyed"..)
        if (this._visible === visible) {
            //  return;
        }
        this._visible = visible;
        this.fire("visible", this._visible);
    }

    /**
     * Sets the {@link Entity} this Marker is associated with.
     *
     * An Entity is optional. When the Marker has an Entity, then {@link Marker#visible} will always be ````false````
     * if {@link Entity#visible} is false.
     *
     * @type {Entity}
     */
    set entity(entity) {
        if (this._entity) {
            if (this._entity === entity) {
                return;
            }
            if (this._onEntityDestroyed !== null) {
                this._entity.off(this._onEntityDestroyed);
                this._onEntityDestroyed = null;
            }
            if (this._onEntityModelDestroyed !== null) {
                this._entity.model.off(this._onEntityModelDestroyed);
                this._onEntityModelDestroyed = null;
            }
        }
        this._entity = entity;
        if (this._entity) {
            if (this._entity instanceof SceneModelEntity) {
                this._onEntityModelDestroyed = this._entity.model.on("destroyed", () => { // SceneModelEntity does not fire events, and cannot exist beyond its VBOSceneModel
                    this._entity = null; // Marker now may become visible, if it was synched to invisible Entity
                    this._onEntityModelDestroyed = null;
                });
            } else {
                this._onEntityDestroyed = this._entity.on("destroyed", () => {
                    this._entity = null;
                    this._onEntityDestroyed = null;
                });
            }
        }
        this.fire("entity", this._entity, true /* forget */);
    }

    /**
     * Gets the {@link Entity} this Marker is associated with.
     *
     * @type {Entity}
     */
    get entity() {
        return this._entity;
    }

    /**
     * Sets whether occlusion testing is performed for this Marker.
     *
     * When this is ````true````, then {@link Marker#visible} will be ````false```` whenever the Marker is occluded by an {@link Entity} in the 3D view.
     *
     * The {@link Scene} periodically occlusion-tests all Markers on every 20th "tick" (which represents a rendered frame). We
     * can adjust that frequency via property {@link Scene#ticksPerOcclusionTest}.
     *
     * @type {Boolean}
     */
    set occludable(occludable) {
        occludable = !!occludable;
        if (occludable === this._occludable) {
            return;
        }
        this._occludable = occludable;
    }

    /**
     * Gets whether occlusion testing is performed for this Marker.
     *
     * When this is ````true````, then {@link Marker#visible} will be ````false```` whenever the Marker is occluded by an {@link Entity} in the 3D view.
     *
     * @type {Boolean}
     */
    get occludable() {
        return this._occludable;
    }

    /**
     * Sets the World-space 3D position of this Marker.
     *
     * Fires a "worldPos" event with new World position.
     *
     * @type {Number[]}
     */
    set worldPos(worldPos) {
        this._worldPos.set(worldPos || [0, 0, 0]);
        worldToRTCPos(this._worldPos, this._origin, this._rtcPos);
        if (this._occludable) {
            this._renderer.markerWorldPosUpdated(this);
        }
        this._viewPosDirty = true;
        this.fire("worldPos", this._worldPos);
        this._needUpdate();
    }

    /**
     * Gets the World-space 3D position of this Marker.
     *
     * @type {Number[]}
     */
    get worldPos() {
        return this._worldPos;
    }

    /**
     * Gets the RTC center of this Marker.
     *
     * This is automatically calculated from {@link Marker#worldPos}.
     *
     * @type {Number[]}
     */
    get origin() {
        return this._origin;
    }

    /**
     * Gets the RTC position of this Marker.
     *
     * This is automatically calculated from {@link Marker#worldPos}.
     *
     * @type {Number[]}
     */
    get rtcPos() {
        return this._rtcPos;
    }

    /**
     * View-space 3D coordinates of this Marker.
     *
     * This property is read-only and is automatically calculated from {@link Marker#worldPos} and the current {@link Camera} position.
     *
     * The Marker fires a "viewPos" event whenever this property changes.
     *
     * @type {Number[]}
     * @final
     */
    get viewPos() {
        this._update();
        return this._viewPos;
    }

    /**
     * Canvas-space 2D coordinates of this Marker.
     *
     * This property is read-only and is automatically calculated from {@link Marker#worldPos} and the current {@link Camera} position and projection.
     *
     * The Marker fires a "canvasPos" event whenever this property changes.
     *
     * @type {Number[]}
     * @final
     */
    get canvasPos() {
        this._update();
        return this._canvasPos;
    }

    /**
     * Indicates if this Marker is currently visible.
     *
     * This is read-only and is automatically calculated.
     *
     * The Marker is **invisible** whenever:
     *
     * * {@link Marker#canvasPos} is currently outside the canvas,
     * * {@link Marker#entity} is set to an {@link Entity} that has {@link Entity#visible} ````false````, or
     * * or {@link Marker#occludable} is ````true```` and the Marker is currently occluded by an Entity in the 3D view.
     *
     * The Marker fires a "visible" event whenever this property changes.
     *
     * @type {Boolean}
     * @final
     */
    get visible() {
        return !!this._visible;
    }

    /**
     * Destroys this Marker.
     */
    destroy() {
        this.fire("destroyed", true);
        this.scene.camera.off(this._onCameraViewMatrix);
        this.scene.camera.off(this._onCameraProjMatrix);
        if (this._entity) {
            if (this._onEntityDestroyed !== null) {
                this._entity.off(this._onEntityDestroyed);
            }
            if (this._onEntityModelDestroyed !== null) {
                this._entity.model.off(this._onEntityModelDestroyed);
            }
        }
        this._renderer.removeMarker(this);
        super.destroy();
    }
}
