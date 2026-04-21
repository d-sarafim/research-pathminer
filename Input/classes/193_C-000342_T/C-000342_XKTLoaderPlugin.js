class XKTLoaderPlugin extends Plugin {

    /**
     * @constructor
     *
     * @param {Viewer} viewer The Viewer.
     * @param {Object} cfg  Plugin configuration.
     * @param {String} [cfg.id="XKTLoader"] Optional ID for this plugin, so that we can find it within {@link Viewer#plugins}.
     * @param {Object} [cfg.objectDefaults] Map of initial default states for each loaded {@link Entity} that represents an object.  Default value is {@link IFCObjectDefaults}.
     * @param {Object} [cfg.dataSource] A custom data source through which the XKTLoaderPlugin can load model and metadata files. Defaults to an instance of {@link XKTDefaultDataSource}, which loads uover HTTP.
     * @param {String[]} [cfg.includeTypes] When loading metadata, only loads objects that have {@link MetaObject}s with {@link MetaObject#type} values in this list.
     * @param {String[]} [cfg.excludeTypes] When loading metadata, never loads objects that have {@link MetaObject}s with {@link MetaObject#type} values in this list.
     * @param {Boolean} [cfg.excludeUnclassifiedObjects=false] When loading metadata and this is ````true````, will only load {@link Entity}s that have {@link MetaObject}s (that are not excluded). This is useful when we don't want Entitys in the Scene that are not represented within IFC navigation components, such as {@link TreeViewPlugin}.
     * @param {Boolean} [cfg.reuseGeometries=true] Indicates whether to enable geometry reuse (````true```` by default) or whether to internally expand
     * all geometry instances into batches (````false````), and not use instancing to render them. Setting this ````false```` can significantly
     * improve Viewer performance for models that have a lot of geometry reuse, but may also increase the amount of
     * browser and GPU memory they require. See [#769](https://github.com/xeokit/xeokit-sdk/issues/769) for more info.
     * @param {Number} [cfg.maxGeometryBatchSize=50000000] Maximum geometry batch size, as number of vertices. This is optionally supplied
     * to limit the size of the batched geometry arrays that {@link SceneModel} internally creates for batched geometries.
     * A low value means less heap allocation/de-allocation while loading batched geometries, but more draw calls and
     * slower rendering speed. A high value means larger heap allocation/de-allocation while loading, but less draw calls
     * and faster rendering speed. It's recommended to keep this somewhere roughly between ````50000```` and ````50000000```.
     * @param {KTX2TextureTranscoder} [cfg.textureTranscoder] Transcoder used internally to transcode KTX2
     * textures within the XKT. Only required when the XKT is version 10 or later, and contains KTX2 textures.
     */
    constructor(viewer, cfg = {}) {

        super("XKTLoader", viewer, cfg);

        this._maxGeometryBatchSize = cfg.maxGeometryBatchSize;

        this.textureTranscoder = cfg.textureTranscoder;
        this.dataSource = cfg.dataSource;
        this.objectDefaults = cfg.objectDefaults;
        this.includeTypes = cfg.includeTypes;
        this.excludeTypes = cfg.excludeTypes;
        this.excludeUnclassifiedObjects = cfg.excludeUnclassifiedObjects;
        this.reuseGeometries = cfg.reuseGeometries;
    }

    /**
     * Gets the ````.xkt```` format versions supported by this XKTLoaderPlugin/
     * @returns {string[]}
     */
    get supportedVersions() {
        return Object.keys(parsers);
    }

    /**
     * Gets the texture transcoder.
     *
     * @type {TextureTranscoder}
     */
    get textureTranscoder() {
        return this._textureTranscoder;
    }

    /**
     * Sets the texture transcoder.
     *
     * @type {TextureTranscoder}
     */
    set textureTranscoder(textureTranscoder) {
        this._textureTranscoder = textureTranscoder;
    }

    /**
     * Gets the custom data source through which the XKTLoaderPlugin can load models and metadata.
     *
     * Default value is {@link XKTDefaultDataSource}, which loads via HTTP.
     *
     * @type {Object}
     */
    get dataSource() {
        return this._dataSource;
    }

    /**
     * Sets a custom data source through which the XKTLoaderPlugin can load models and metadata.
     *
     * Default value is {@link XKTDefaultDataSource}, which loads via HTTP.
     *
     * @type {Object}
     */
    set dataSource(value) {
        this._dataSource = value || new XKTDefaultDataSource();
    }

    /**
     * Gets map of initial default states for each loaded {@link Entity} that represents an object.
     *
     * Default value is {@link IFCObjectDefaults}.
     *
     * @type {{String: Object}}
     */
    get objectDefaults() {
        return this._objectDefaults;
    }

    /**
     * Sets map of initial default states for each loaded {@link Entity} that represents an object.
     *
     * Default value is {@link IFCObjectDefaults}.
     *
     * @type {{String: Object}}
     */
    set objectDefaults(value) {
        this._objectDefaults = value || IFCObjectDefaults;
    }

    /**
     * Gets the whitelist of the IFC types loaded by this XKTLoaderPlugin.
     *
     * When loading models with metadata, causes this XKTLoaderPlugin to only load objects whose types are in this
     * list. An object's type is indicated by its {@link MetaObject}'s {@link MetaObject#type}.
     *
     * Default value is ````undefined````.
     *
     * @type {String[]}
     */
    get includeTypes() {
        return this._includeTypes;
    }

    /**
     * Sets the whitelist of the IFC types loaded by this XKTLoaderPlugin.
     *
     * When loading models with metadata, causes this XKTLoaderPlugin to only load objects whose types are in this
     * list. An object's type is indicated by its {@link MetaObject}'s {@link MetaObject#type}.
     *
     * Default value is ````undefined````.
     *
     * @type {String[]}
     */
    set includeTypes(value) {
        this._includeTypes = value;
    }

    /**
     * Gets the blacklist of IFC types that are never loaded by this XKTLoaderPlugin.
     *
     * When loading models with metadata, causes this XKTLoaderPlugin to **not** load objects whose types are in this
     * list. An object's type is indicated by its {@link MetaObject}'s {@link MetaObject#type}.
     *
     * Default value is ````undefined````.
     *
     * @type {String[]}
     */
    get excludeTypes() {
        return this._excludeTypes;
    }

    /**
     * Sets the blacklist of IFC types that are never loaded by this XKTLoaderPlugin.
     *
     * When loading models with metadata, causes this XKTLoaderPlugin to **not** load objects whose types are in this
     * list. An object's type is indicated by its {@link MetaObject}'s {@link MetaObject#type}.
     *
     * Default value is ````undefined````.
     *
     * @type {String[]}
     */
    set excludeTypes(value) {
        this._excludeTypes = value;
    }

    /**
     * Gets whether we load objects that don't have IFC types.
     *
     * When loading models with metadata and this is ````true````, XKTLoaderPlugin will not load objects
     * that don't have IFC types.
     *
     * Default value is ````false````.
     *
     * @type {Boolean}
     */
    get excludeUnclassifiedObjects() {
        return this._excludeUnclassifiedObjects;
    }

    /**
     * Sets whether we load objects that don't have IFC types.
     *
     * When loading models with metadata and this is ````true````, XKTLoaderPlugin will not load objects
     * that don't have IFC types.
     *
     * Default value is ````false````.
     *
     * @type {Boolean}
     */
    set excludeUnclassifiedObjects(value) {
        this._excludeUnclassifiedObjects = !!value;
    }

    /**
     * Gets whether XKTLoaderPlugin globalizes each {@link Entity#id} and {@link MetaObject#id} as it loads a model.
     *
     * Default value is ````false````.
     *
     * @type {Boolean}
     */
    get globalizeObjectIds() {
        return this._globalizeObjectIds;
    }

    /**
     * Sets whether XKTLoaderPlugin globalizes each {@link Entity#id} and {@link MetaObject#id} as it loads a model.
     *
     * Set  this ````true```` when you need to load multiple instances of the same model, to avoid ID clashes
     * between the objects in the different instances.
     *
     * When we load a model with this set ````true````, then each {@link Entity#id} and {@link MetaObject#id} will be
     * prefixed by the ID of the model, ie. ````<modelId>#<objectId>````.
     *
     * {@link Entity#originalSystemId} and {@link MetaObject#originalSystemId} will always hold the original, un-prefixed, ID values.
     *
     * Default value is ````false````.
     *
     * See the main {@link XKTLoaderPlugin} class documentation for usage info.
     *
     * @type {Boolean}
     */
    set globalizeObjectIds(value) {
        this._globalizeObjectIds = !!value;
    }

    /**
     * Gets whether XKTLoaderPlugin enables geometry reuse when loading models.
     *
     * Default value is ````true````.
     *
     * @type {Boolean}
     */
    get reuseGeometries() {
        return this._reuseGeometries;
    }

    /**
     * Sets whether XKTLoaderPlugin enables geometry reuse when loading models.
     *
     * Default value is ````true````.
     *
     * Geometry reuse saves memory, but can impact Viewer performance when there are many reused geometries. For
     * this reason, we can set this ````false```` to disable geometry reuse for models loaded by this XKTLoaderPlugin
     * (which will then "expand" the geometry instances into batches instead).
     *
     * The result will be be less WebGL draw calls (which are expensive), at the cost of increased memory footprint.
     *
     * See [#769](https://github.com/xeokit/xeokit-sdk/issues/769) for more info.
     *
     * @type {Boolean}
     */
    set reuseGeometries(value) {
        this._reuseGeometries = value !== false;
    }

    /**
     * Loads an ````.xkt```` model into this XKTLoaderPlugin's {@link Viewer}.
     *
     * Since xeokit/xeokit-sdk 1.9.0, XKTLoaderPlugin has supported XKT 8, which bundles the metamodel
     * data (eg. an IFC element hierarchy) in the XKT file itself. For XKT 8, we therefore no longer need to
     * load the metamodel data from a separate accompanying JSON file, as we did with previous XKT versions.
     * However, if we do choose to specify a separate metamodel JSON file to load (eg. for backward compatibility
     * in data pipelines), then that metamodel will be loaded and the metamodel in the XKT 8 file will be ignored.
     *
     * @param {*} params Loading parameters.
     * @param {String} [params.id] ID to assign to the root {@link Entity#id}, unique among all components in the Viewer's {@link Scene}, generated automatically by default.
     * @param {String} [params.src] Path to a *````.xkt````* file, as an alternative to the ````xkt```` parameter.
     * @param {ArrayBuffer} [params.xkt] The *````.xkt````* file data, as an alternative to the ````src```` parameter.
     * @param {String} [params.metaModelSrc] Path to an optional metadata file, as an alternative to the ````metaModelData```` parameter.
     * @param {*} [params.metaModelData] JSON model metadata, as an alternative to the ````metaModelSrc```` parameter.
     * @param {{String:Object}} [params.objectDefaults] Map of initial default states for each loaded {@link Entity} that represents an object. Default value is {@link IFCObjectDefaults}.
     * @param {String[]} [params.includeTypes] When loading metadata, only loads objects that have {@link MetaObject}s with {@link MetaObject#type} values in this list.
     * @param {String[]} [params.excludeTypes] When loading metadata, never loads objects that have {@link MetaObject}s with {@link MetaObject#type} values in this list.
     * @param {Boolean} [params.edges=false] Whether or not xeokit renders the model with edges emphasized.
     * @param {Number[]} [params.origin=[0,0,0]] The model's World-space double-precision 3D origin. Use this to position the model within xeokit's World coordinate system, using double-precision coordinates.
     * @param {Number[]} [params.position=[0,0,0]] The model single-precision 3D position, relative to the ````origin```` parameter.
     * @param {Number[]} [params.scale=[1,1,1]] The model's scale.
     * @param {Number[]} [params.rotation=[0,0,0]] The model's orientation, given as Euler angles in degrees, for each of the X, Y and Z axis.
     * @param {Number[]} [params.matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]] The model's world transform matrix. Overrides the position, scale and rotation parameters. Relative to ````origin````.
     * @param {Boolean} [params.edges=false] Indicates if the model's edges are initially emphasized.
     * @param {Boolean} [params.saoEnabled=true] Indicates if Scalable Ambient Obscurance (SAO) is enabled for the model. SAO is configured by the Scene's {@link SAO} component. Only works when {@link SAO#enabled} is also ````true````
     * @param {Boolean} [params.pbrEnabled=true] Indicates if physically-based rendering (PBR) is enabled for the model. Overrides ````colorTextureEnabled````. Only works when {@link Scene#pbrEnabled} is also ````true````.
     * @param {Boolean} [params.colorTextureEnabled=true] Indicates if base color texture rendering is enabled for the model. Overridden by ````pbrEnabled````.  Only works when {@link Scene#colorTextureEnabled} is also ````true````.
     * @param {Number} [params.backfaces=false] When we set this ````true````, then we force rendering of backfaces for the model. When
     * we leave this ````false````, then we allow the Viewer to decide when to render backfaces. In that case, the
     * Viewer will hide backfaces on watertight meshes, show backfaces on open meshes, and always show backfaces on meshes when we slice them open with {@link SectionPlane}s.
     * @param {Boolean} [params.excludeUnclassifiedObjects=false] When loading metadata and this is ````true````, will only load {@link Entity}s that have {@link MetaObject}s (that are not excluded). This is useful when we don't want Entitys in the Scene that are not represented within IFC navigation components, such as {@link TreeViewPlugin}.
     * @param {Boolean} [params.globalizeObjectIds=false] Indicates whether to globalize each {@link Entity#id} and {@link MetaObject#id}, in case you need to prevent ID clashes with other models. See {@link XKTLoaderPlugin#globalizeObjectIds} for more info.
     * @param {Boolean} [params.reuseGeometries=true] Indicates whether to enable geometry reuse (````true```` by default) or whether to expand
     * all geometry instances into batches (````false````), and not use instancing to render them. Setting this ````false```` can significantly
     * improve Viewer performance for models that have excessive geometry reuse, but may also increases the amount of
     * browser and GPU memory used by the model. See [#769](https://github.com/xeokit/xeokit-sdk/issues/769) for more info.
     * @param {Boolean} [params.dtxEnabled=true] When ````true```` (default) use data textures (DTX), where appropriate, to
     * represent the returned model. Set false to always use vertex buffer objects (VBOs). Note that DTX is only applicable
     * to non-textured triangle meshes, and that VBOs are always used for meshes that have textures, line segments, or point
     * primitives. Only works while {@link DTX#enabled} is also ````true````.
     * @returns {Entity} Entity representing the model, which will have {@link Entity#isModel} set ````true```` and will be registered by {@link Entity#id} in {@link Scene#models}.
     */
    load(params = {}) {

        if (params.id && this.viewer.scene.components[params.id]) {
            this.error("Component with this ID already exists in viewer: " + params.id + " - will autogenerate this ID");
            delete params.id;
        }

        const sceneModel = new SceneModel(this.viewer.scene, utils.apply(params, {
            isModel: true,
            textureTranscoder: this._textureTranscoder,
            maxGeometryBatchSize: this._maxGeometryBatchSize,
            origin: params.origin,
            disableVertexWelding: params.disableVertexWelding || false,
            disableIndexRebucketing: params.disableIndexRebucketing || false,
            dtxEnabled: params.dtxEnabled
        }));

        const modelId = sceneModel.id;  // In case ID was auto-generated

        if (!params.src && !params.xkt) {
            this.error("load() param expected: src or xkt");
            return sceneModel; // Return new empty model
        }

        const options = {};
        const includeTypes = params.includeTypes || this._includeTypes;
        const excludeTypes = params.excludeTypes || this._excludeTypes;
        const objectDefaults = params.objectDefaults || this._objectDefaults;

        options.reuseGeometries = (params.reuseGeometries !== null && params.reuseGeometries !== undefined) ? params.reuseGeometries : (this._reuseGeometries !== false);

        if (includeTypes) {
            options.includeTypesMap = {};
            for (let i = 0, len = includeTypes.length; i < len; i++) {
                options.includeTypesMap[includeTypes[i]] = true;
            }
        }

        if (excludeTypes) {
            options.excludeTypesMap = {};
            for (let i = 0, len = excludeTypes.length; i < len; i++) {
                options.excludeTypesMap[excludeTypes[i]] = true;
            }
        }

        if (objectDefaults) {
            options.objectDefaults = objectDefaults;
        }

        options.excludeUnclassifiedObjects = (params.excludeUnclassifiedObjects !== undefined) ? (!!params.excludeUnclassifiedObjects) : this._excludeUnclassifiedObjects;
        options.globalizeObjectIds = (params.globalizeObjectIds !== undefined && params.globalizeObjectIds !== null) ? (!!params.globalizeObjectIds) : this._globalizeObjectIds;

        if (params.metaModelSrc || params.metaModelData) {

            const processMetaModelData = (metaModelData) => {

                const metaModel = this.viewer.metaScene.createMetaModel(modelId, metaModelData, {
                    includeTypes: includeTypes,
                    excludeTypes: excludeTypes,
                    globalizeObjectIds: options.globalizeObjectIds
                });

                if (!metaModel) {
                    return false;
                }

                if (params.src) {
                    this._loadModel(params.src, params, options, sceneModel);
                } else {
                    this._parseModel(params.xkt, params, options, sceneModel);
                }

                sceneModel.once("destroyed", () => {
                    this.viewer.metaScene.destroyMetaModel(sceneModel.id);
                });

                return true;
            };

            if (params.metaModelSrc) {

                const metaModelSrc = params.metaModelSrc;

                this.viewer.scene.canvas.spinner.processes++;

                this._dataSource.getMetaModel(metaModelSrc, (metaModelData) => {

                    if (sceneModel.destroyed) {
                        return;
                    }

                    if (!processMetaModelData(metaModelData)) {

                        this.error(`load(): Failed to load model metadata for model '${modelId} from '${metaModelSrc}' - metadata not valid`);

                        sceneModel.fire("error", "Metadata not valid");
                    }

                    this.viewer.scene.canvas.spinner.processes--;

                }, (errMsg) => {

                    this.error(`load(): Failed to load model metadata for model '${modelId} from  '${metaModelSrc}' - ${errMsg}`);

                    sceneModel.fire("error", `Failed to load model metadata from  '${metaModelSrc}' - ${errMsg}`);

                    this.viewer.scene.canvas.spinner.processes--;
                });

            } else if (params.metaModelData) {

                if (!processMetaModelData(params.metaModelData)) {

                    this.error(`load(): Failed to load model metadata for model '${modelId} from '${params.metaModelSrc}' - metadata not valid`);

                    sceneModel.fire("error", "Metadata not valid");
                }
            }

        } else {
            if (params.src) {
                this._loadModel(params.src, params, options, sceneModel);
            } else {
                this._parseModel(params.xkt, params, options, sceneModel);
            }
        }

        return sceneModel;
    }

    _loadModel(src, params, options, sceneModel) {

        const spinner = this.viewer.scene.canvas.spinner;

        spinner.processes++;

        this._dataSource.getXKT(params.src, (arrayBuffer) => {
                this._parseModel(arrayBuffer, params, options, sceneModel);
                spinner.processes--;
            },
            (errMsg) => {
                spinner.processes--;
                this.error(errMsg);
                sceneModel.fire("error", errMsg);
            });
    }

    _parseModel(arrayBuffer, params, options, sceneModel) {

        if (sceneModel.destroyed) {
            return;
        }

        const dataView = new DataView(arrayBuffer);
        const dataArray = new Uint8Array(arrayBuffer);
        const xktVersion = dataView.getUint32(0, true);
        const parser = parsers[xktVersion];

        if (!parser) {
            this.error("Unsupported .XKT file version: " + xktVersion + " - this XKTLoaderPlugin supports versions " + Object.keys(parsers));
            return;
        }

        this.log("Loading .xkt V" + xktVersion);

        const numElements = dataView.getUint32(4, true);
        const elements = [];
        let byteOffset = (numElements + 2) * 4;
        for (let i = 0; i < numElements; i++) {
            const elementSize = dataView.getUint32((i + 2) * 4, true);
            elements.push(dataArray.subarray(byteOffset, byteOffset + elementSize));
            byteOffset += elementSize;
        }

        parser.parse(this.viewer, options, elements, sceneModel);

        sceneModel.finalize();

        this._createDefaultMetaModelIfNeeded(sceneModel, params, options);

        sceneModel.scene.once("tick", () => {
            if (sceneModel.destroyed) {
                return;
            }
            sceneModel.scene.fire("modelLoaded", sceneModel.id); // FIXME: Assumes listeners know order of these two events
            sceneModel.fire("loaded", true, false); // Don't forget the event, for late subscribers
        });
    }

    _createDefaultMetaModelIfNeeded(sceneModel, params, options) {

        const metaModelId = sceneModel.id;

        if (!this.viewer.metaScene.metaModels[metaModelId]) {

            const metaModelData = {
                metaObjects: []
            };

            metaModelData.metaObjects.push({
                id: metaModelId,
                type: "default",
                name: metaModelId,
                parent: null
            });

            const entityList = sceneModel.entityList;

            for (let i = 0, len = entityList.length; i < len; i++) {
                const entity = entityList[i];
                if (entity.isObject) {
                    metaModelData.metaObjects.push({
                        id: entity.id,
                        type: "default",
                        name: entity.id,
                        parent: metaModelId
                    });
                }
            }

            const src = params.src;

            this.viewer.metaScene.createMetaModel(metaModelId, metaModelData, {

                includeTypes: options.includeTypes,
                excludeTypes: options.excludeTypes,
                globalizeObjectIds: options.globalizeObjectIds,

                getProperties: async (propertiesId) => {
                    return await this._dataSource.getProperties(src, propertiesId);
                }
            });

            sceneModel.once("destroyed", () => {
                this.viewer.metaScene.destroyMetaModel(metaModelId);
            });
        }
    }
}
