class OBJLoaderPlugin extends Plugin {

    /**
     * @constructor
     *
     * @param {Viewer} viewer The Viewer.
     * @param {Object} cfg Plugin configuration.
     * @param {String} [cfg.id="OBJLoader"] Optional ID for this plugin, so that we can find it within {@link Viewer#plugins}.
     */
    constructor(viewer, cfg) {

        super("OBJLoader", viewer, cfg);

        /**
         * @private
         */
        this._sceneGraphLoader = new OBJSceneGraphLoader();
    }

    /**
     * Loads an OBJ model from a file into this OBJLoader's {@link Viewer}.
     *
     * @param {*} params  Loading parameters.
     * @param {String} params.id ID to assign to the model's root {@link Entity}, unique among all components in the Viewer's {@link Scene}.
     * @param {String} params.src Path to an OBJ file.
     * @param {String} [params.metaModelSrc] Path to an optional metadata file.
     * @param {Number[]} [params.position=[0,0,0]] The model World-space 3D position.
     * @param {Number[]} [params.scale=[1,1,1]] The model's World-space scale.
     * @param {Number[]} [params.rotation=[0,0,0]] The model's World-space rotation, as Euler angles given in degrees, for each of the X, Y and Z axis.
     * @param {Number[]} [params.matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]] The model's world transform matrix. Overrides the position, scale and rotation parameters.
     * @param {Number} [params.edgeThreshold=20] When xraying, highlighting, selecting or edging, this is the threshold angle between normals of adjacent triangles, below which their shared wireframe edge is not drawn.
     * @returns {Entity} Entity representing the model, which will have {@link Entity#isModel} set ````true```` and will be registered by {@link Entity#id} in {@link Scene#models}
     */
    load(params = {}) {

        if (params.id && this.viewer.scene.components[params.id]) {
            this.error("Component with this ID already exists in viewer: " + params.id + " - will autogenerate this ID");
            delete params.id;
        }

        var modelNode = new Node(this.viewer.scene, utils.apply(params, {
            isModel: true
        }));

        const modelId = modelNode.id;  // In case ID was auto-generated
        const src = params.src;

        if (!src) {
            this.error("load() param expected: src");
            return modelNode;
        }

        if (params.metaModelSrc) {
            const metaModelSrc = params.metaModelSrc;
            utils.loadJSON(metaModelSrc,
                (modelMetadata) => {
                    this.viewer.metaScene.createMetaModel(modelId, modelMetadata);
                    this._sceneGraphLoader.load(modelNode, src, params);
                },
                (errMsg) => {
                    this.error(`load(): Failed to load model modelMetadata for model '${modelId} from  '${metaModelSrc}' - ${errMsg}`);
                });
        } else {
            this._sceneGraphLoader.load(modelNode, src, params);
        }

        modelNode.once("destroyed", () => {
            this.viewer.metaScene.destroyMetaModel(modelId);
        });

        return modelNode;
    }

    /**
     * Destroys this OBJLoaderPlugin.
     */
    destroy() {
        super.destroy();
    }
}
