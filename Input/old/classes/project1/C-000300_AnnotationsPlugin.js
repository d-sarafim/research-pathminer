class AnnotationsPlugin extends Plugin {

    /**
     * @constructor
     * @param {Viewer} viewer The Viewer.
     * @param {Object} cfg  Plugin configuration.
     * @param {String} [cfg.id="Annotations"] Optional ID for this plugin, so that we can find it within {@link Viewer#plugins}.
     * @param {String} [cfg.markerHTML] HTML text template for Annotation markers. Defaults to ````<div></div>````. Ignored on {@link Annotation}s configured with a ````markerElementId````.
     * @param {String} [cfg.labelHTML] HTML text template for Annotation labels. Defaults to ````<div></div>````.  Ignored on {@link Annotation}s configured with a ````labelElementId````.
     * @param {HTMLElement} [cfg.container] Container DOM element for markers and labels. Defaults to ````document.body````.
     * @param {{String:(String|Number)}} [cfg.values={}] Map of default values to insert into the HTML templates for the marker and label.
     * @param {Number}  [cfg.surfaceOffset=0.3] The amount by which each {@link Annotation} is offset from the surface of
     * its {@link Entity} when we create the Annotation by supplying a {@link PickResult} to {@link AnnotationsPlugin#createAnnotation}.
     */
    constructor(viewer, cfg) {

        super("Annotations", viewer);

        this._labelHTML = cfg.labelHTML || "<div></div>";
        this._markerHTML = cfg.markerHTML || "<div></div>";
        this._container = cfg.container || document.body;
        this._values = cfg.values || {};

        /**
         * The {@link Annotation}s created by {@link AnnotationsPlugin#createAnnotation}, each mapped to its {@link Annotation#id}.
         * @type {{String:Annotation}}
         */
        this.annotations = {};

        this.surfaceOffset = cfg.surfaceOffset;
    }

    /**
     * Gets the plugin's HTML container element, if any.
     * @returns {*|HTMLElement|HTMLElement}
     */
    getContainerElement() {
        return this._container;
    }

    /**
     * @private
     */
    send(name, value) {
        switch (name) {
            case "clearAnnotations":
                this.clear();
                break;
        }
    }

    /**
     * Sets the amount by which each {@link Annotation} is offset from the surface of its {@link Entity}, when we
     * create the Annotation by supplying a {@link PickResult} to {@link AnnotationsPlugin#createAnnotation}.
     *
     * See the class comments for more info.
     *
     * This is ````0.3```` by default.
     *
     * @param {Number} surfaceOffset The surface offset.
     */
    set surfaceOffset(surfaceOffset) {
        if (surfaceOffset === undefined || surfaceOffset === null) {
            surfaceOffset = 0.3;
        }
        this._surfaceOffset = surfaceOffset;
    }

    /**
     * Gets the amount by which an {@link Annotation} is offset from the surface of its {@link Entity} when
     * created by {@link AnnotationsPlugin#createAnnotation}, when we
     * create the Annotation by supplying a {@link PickResult} to {@link AnnotationsPlugin#createAnnotation}.
     *
     * This is ````0.3```` by default.
     *
     * @returns {Number} The surface offset.
     */
    get surfaceOffset() {
        return this._surfaceOffset;
    }

    /**
     * Creates an {@link Annotation}.
     *
     * The Annotation is then registered by {@link Annotation#id} in {@link AnnotationsPlugin#annotations}.
     *
     * @param {Object} params Annotation configuration.
     * @param {String} params.id Unique ID to assign to {@link Annotation#id}. The Annotation will be registered by this in {@link AnnotationsPlugin#annotations} and {@link Scene.components}. Must be unique among all components in the {@link Viewer}.
     * @param {String} [params.markerElementId] ID of pre-existing DOM element to render the marker. This overrides ````markerHTML```` and does not support ````values```` (data is baked into the label DOM element).
     * @param {String} [params.labelElementId] ID of pre-existing DOM element to render the label. This overrides ````labelHTML```` and does not support ````values```` (data is baked into the label DOM element).
     * @param {String} [params.markerHTML] HTML text template for the Annotation marker. Defaults to the marker HTML given to the AnnotationsPlugin constructor. Ignored if you provide ````markerElementId````.
     * @param {String} [params.labelHTML] HTML text template for the Annotation label. Defaults to the label HTML given to the AnnotationsPlugin constructor. Ignored if you provide ````labelElementId````.
     * @param {Number[]} [params.worldPos=[0,0,0]] World-space position of the Annotation marker, assigned to {@link Annotation#worldPos}.
     * @param {Entity} [params.entity] Optional {@link Entity} to associate the Annotation with. Causes {@link Annotation#visible} to be ````false```` whenever {@link Entity#visible} is also ````false````.
     * @param {PickResult} [params.pickResult] Sets the Annotation's World-space position and direction vector from the given {@link PickResult}'s {@link PickResult#worldPos} and {@link PickResult#worldNormal}, and the Annotation's Entity from {@link PickResult#entity}. Causes ````worldPos```` and ````entity```` parameters to be ignored, if they are also given.
     * @param {Boolean} [params.occludable=false] Indicates whether or not the {@link Annotation} marker and label are hidden whenever the marker occluded by {@link Entity}s in the {@link Scene}. The
     * {@link Scene} periodically occlusion-tests all Annotations on every 20th "tick" (which represents a rendered frame). We can adjust that frequency via property {@link Scene#ticksPerOcclusionTest}.
     * @param  {{String:(String|Number)}} [params.values={}] Map of values to insert into the HTML templates for the marker and label. These will be inserted in addition to any values given to the AnnotationsPlugin constructor.
     * @param {Boolean} [params.markerShown=true] Whether to initially show the {@link Annotation} marker.
     * @param {Boolean} [params.labelShown=false] Whether to initially show the {@link Annotation} label.
     * @param {Number[]} [params.eye] Optional World-space position for {@link Camera#eye}, used when this Annotation is associated with a {@link Camera} position.
     * @param {Number[]} [params.look] Optional World-space position for {@link Camera#look}, used when this Annotation is associated with a {@link Camera} position.
     * @param {Number[]} [params.up] Optional World-space position for {@link Camera#up}, used when this Annotation is associated with a {@link Camera} position.
     * @param {String} [params.projection] Optional projection type for {@link Camera#projection}, used when this Annotation is associated with a {@link Camera} position.
     * @returns {Annotation} The new {@link Annotation}.
     */
    createAnnotation(params) {
        if (this.viewer.scene.components[params.id]) {
            this.error("Viewer component with this ID already exists: " + params.id);
            delete params.id;
        }
        var worldPos;
        var entity;
        params.pickResult = params.pickResult || params.pickRecord;
        if (params.pickResult) {
            const pickResult = params.pickResult;
            if (!pickResult.worldPos || !pickResult.worldNormal) {
                this.error("Param 'pickResult' does not have both worldPos and worldNormal");
            } else {
                const normalizedWorldNormal = math.normalizeVec3(pickResult.worldNormal, tempVec3a);
                const offsetVec = math.mulVec3Scalar(normalizedWorldNormal, this._surfaceOffset, tempVec3b);
                const offsetWorldPos = math.addVec3(pickResult.worldPos, offsetVec, tempVec3c);
                worldPos = offsetWorldPos;
                entity = pickResult.entity;
            }
        } else {
            worldPos = params.worldPos;
            entity = params.entity;
        }

        var markerElement = null;
        if (params.markerElementId) {
            markerElement = document.getElementById(params.markerElementId);
            if (!markerElement) {
                this.error("Can't find DOM element for 'markerElementId' value '" + params.markerElementId + "' - defaulting to internally-generated empty DIV");
            }
        }

        var labelElement = null;
        if (params.labelElementId) {
            labelElement = document.getElementById(params.labelElementId);
            if (!labelElement) {
                this.error("Can't find DOM element for 'labelElementId' value '" + params.labelElementId + "' - defaulting to internally-generated empty DIV");
            }
        }

        const annotation = new Annotation(this.viewer.scene, {
            id: params.id,
            plugin: this,
            entity: entity,
            worldPos: worldPos,
            container: this._container,
            markerElement: markerElement,
            labelElement: labelElement,
            markerHTML: params.markerHTML || this._markerHTML,
            labelHTML: params.labelHTML || this._labelHTML,
            occludable: params.occludable,
            values: utils.apply(params.values, utils.apply(this._values, {})),
            markerShown: params.markerShown,
            labelShown: params.labelShown,
            eye: params.eye,
            look: params.look,
            up: params.up,
            projection: params.projection,
            visible: (params.visible !== false)
        });
        this.annotations[annotation.id] = annotation;
        annotation.on("destroyed", () => {
            delete this.annotations[annotation.id];
            this.fire("annotationDestroyed", annotation.id);
        });
        this.fire("annotationCreated", annotation.id);
        return annotation;
    }

    /**
     * Destroys an {@link Annotation}.
     *
     * @param {String} id ID of Annotation to destroy.
     */
    destroyAnnotation(id) {
        var annotation = this.annotations[id];
        if (!annotation) {
            this.log("Annotation not found: " + id);
            return;
        }
        annotation.destroy();
    }

    /**
     * Destroys all {@link Annotation}s.
     */
    clear() {
        const ids = Object.keys(this.annotations);
        for (var i = 0, len = ids.length; i < len; i++) {
            this.destroyAnnotation(ids[i]);
        }
    }

    /**
     * Destroys this AnnotationsPlugin.
     *
     * Destroys all {@link Annotation}s first.
     */
    destroy() {
        this.clear();
        super.destroy();
    }
}
