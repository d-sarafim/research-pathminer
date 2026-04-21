init(appOptions) {
    const device = appOptions.graphicsDevice;

    Debug.assert(device, "The application cannot be created without a valid GraphicsDevice");

    /**
     * The graphics device used by the application.
     *
     * @type {import('../platform/graphics/graphics-device.js').GraphicsDevice}
     */
    this.graphicsDevice = device;
    GraphicsDeviceAccess.set(device);

    this._initDefaultMaterial();
    this._initProgramLibrary();
    this.stats = new ApplicationStats(device);

    /**
     * @type {import('../platform/sound/manager.js').SoundManager}
     * @private
     */
    this._soundManager = appOptions.soundManager;

    /**
     * The resource loader.
     *
     * @type {ResourceLoader}
     */
    this.loader = new ResourceLoader(this);

    LightsBuffer.init(device);

    /**
     * Stores all entities that have been created for this app by guid.
     *
     * @type {Object<string, Entity>}
     * @ignore
     */
    this._entityIndex = {};

    /**
     * The scene managed by the application.
     *
     * @type {Scene}
     * @example
     * // Set the tone mapping property of the application's scene
     * this.app.scene.toneMapping = pc.TONEMAP_FILMIC;
     */
    this.scene = new Scene(device);
    this._registerSceneImmediate(this.scene);

    /**
     * The root entity of the application.
     *
     * @type {Entity}
     * @example
     * // Return the first entity called 'Camera' in a depth-first search of the scene hierarchy
     * const camera = this.app.root.findByName('Camera');
     */
    this.root = new Entity();
    this.root._enabledInHierarchy = true;

    /**
     * The asset registry managed by the application.
     *
     * @type {AssetRegistry}
     * @example
     * // Search the asset registry for all assets with the tag 'vehicle'
     * const vehicleAssets = this.app.assets.findByTag('vehicle');
     */
    this.assets = new AssetRegistry(this.loader);
    if (appOptions.assetPrefix) this.assets.prefix = appOptions.assetPrefix;

    /**
     * @type {BundleRegistry}
     * @ignore
     */
    this.bundles = new BundleRegistry(this.assets);

    /**
     * Set this to false if you want to run without using bundles. We set it to true only if
     * TextDecoder is available because we currently rely on it for untarring.
     *
     * @type {boolean}
     * @ignore
     */
    this.enableBundles = (typeof TextDecoder !== 'undefined');

    this.scriptsOrder = appOptions.scriptsOrder || [];

    /**
     * The application's script registry.
     *
     * @type {ScriptRegistry}
     */
    this.scripts = new ScriptRegistry(this);

    /**
     * Handles localization.
     *
     * @type {I18n}
     */
    this.i18n = new I18n(this);

    /**
     * The scene registry managed by the application.
     *
     * @type {SceneRegistry}
     * @example
     * // Search the scene registry for a item with the name 'racetrack1'
     * const sceneItem = this.app.scenes.find('racetrack1');
     *
     * // Load the scene using the item's url
     * this.app.scenes.loadScene(sceneItem.url);
     */
    this.scenes = new SceneRegistry(this);

    const self = this;
    this.defaultLayerWorld = new Layer({
        name: "World",
        id: LAYERID_WORLD
    });

    this.sceneGrab = new SceneGrab(this.graphicsDevice, this.scene);
    this.defaultLayerDepth = this.sceneGrab.layer;

    this.defaultLayerSkybox = new Layer({
        enabled: true,
        name: "Skybox",
        id: LAYERID_SKYBOX,
        opaqueSortMode: SORTMODE_NONE
    });
    this.defaultLayerUi = new Layer({
        enabled: true,
        name: "UI",
        id: LAYERID_UI,
        transparentSortMode: SORTMODE_MANUAL
    });
    this.defaultLayerImmediate = new Layer({
        enabled: true,
        name: "Immediate",
        id: LAYERID_IMMEDIATE,
        opaqueSortMode: SORTMODE_NONE
    });

    const defaultLayerComposition = new LayerComposition("default");
    defaultLayerComposition.pushOpaque(this.defaultLayerWorld);
    defaultLayerComposition.pushOpaque(this.defaultLayerDepth);
    defaultLayerComposition.pushOpaque(this.defaultLayerSkybox);
    defaultLayerComposition.pushTransparent(this.defaultLayerWorld);
    defaultLayerComposition.pushOpaque(this.defaultLayerImmediate);
    defaultLayerComposition.pushTransparent(this.defaultLayerImmediate);
    defaultLayerComposition.pushTransparent(this.defaultLayerUi);
    this.scene.layers = defaultLayerComposition;

    // Default layers patch
    this.scene.on('set:layers', function (oldComp, newComp) {
        const list = newComp.layerList;
        let layer;
        for (let i = 0; i < list.length; i++) {
            layer = list[i];
            switch (layer.id) {
                case LAYERID_DEPTH:
                    self.sceneGrab.patch(layer);
                    break;
            }
        }
    });

    // placeholder texture for area light LUTs
    AreaLightLuts.createPlaceholder(device);

    /**
     * The forward renderer.
     *
     * @type {ForwardRenderer}
     * @ignore
     */
    this.renderer = new ForwardRenderer(device);
    this.renderer.scene = this.scene;

    /**
     * The frame graph.
     *
     * @type {FrameGraph}
     * @ignore
     */
    this.frameGraph = new FrameGraph();

    /**
     * The run-time lightmapper.
     *
     * @type {import('./lightmapper/lightmapper.js').Lightmapper}
     */
    this.lightmapper = null;
    if (appOptions.lightmapper) {
        this.lightmapper = new appOptions.lightmapper(device, this.root, this.scene, this.renderer, this.assets);
        this.once('prerender', this._firstBake, this);
    }

    /**
     * The application's batch manager.
     *
     * @type {import('../scene/batching/batch-manager.js').BatchManager}
     * @private
     */
    this._batcher = null;
    if (appOptions.batchManager) {
        this._batcher = new appOptions.batchManager(device, this.root, this.scene);
        this.once('prerender', this._firstBatch, this);
    }

    /**
     * The keyboard device.
     *
     * @type {import('../platform/input/keyboard.js').Keyboard}
     */
    this.keyboard = appOptions.keyboard || null;

    /**
     * The mouse device.
     *
     * @type {import('../platform/input/mouse.js').Mouse}
     */
    this.mouse = appOptions.mouse || null;

    /**
     * Used to get touch events input.
     *
     * @type {import('../platform/input/touch-device.js').TouchDevice}
     */
    this.touch = appOptions.touch || null;

    /**
     * Used to access GamePad input.
     *
     * @type {import('../platform/input/game-pads.js').GamePads}
     */
    this.gamepads = appOptions.gamepads || null;

    /**
     * Used to handle input for {@link ElementComponent}s.
     *
     * @type {import('./input/element-input.js').ElementInput}
     */
    this.elementInput = appOptions.elementInput || null;
    if (this.elementInput)
        this.elementInput.app = this;

    /**
     * The XR Manager that provides ability to start VR/AR sessions.
     *
     * @type {import('./xr/xr-manager.js').XrManager}
     * @example
     * // check if VR is available
     * if (app.xr.isAvailable(pc.XRTYPE_VR)) {
     *     // VR is available
     * }
     */
    this.xr = appOptions.xr ? new appOptions.xr(this) : null;

    if (this.elementInput)
        this.elementInput.attachSelectEvents();

    /**
     * @type {boolean}
     * @ignore
     */
    this._inTools = false;

    /**
     * @type {Asset|null}
     * @private
     */
    this._skyboxAsset = null;

    /**
     * @type {string}
     * @ignore
     */
    this._scriptPrefix = appOptions.scriptPrefix || '';

    if (this.enableBundles) {
        this.loader.addHandler("bundle", new BundleHandler(this));
    }

    // create and register all required resource handlers
    appOptions.resourceHandlers.forEach((resourceHandler) => {
        const handler = new resourceHandler(this);
        this.loader.addHandler(handler.handlerType, handler);
    });

    /**
     * The application's component system registry. The Application constructor adds the
     * following component systems to its component system registry:
     *
     * - anim ({@link AnimComponentSystem})
     * - animation ({@link AnimationComponentSystem})
     * - audiolistener ({@link AudioListenerComponentSystem})
     * - button ({@link ButtonComponentSystem})
     * - camera ({@link CameraComponentSystem})
     * - collision ({@link CollisionComponentSystem})
     * - element ({@link ElementComponentSystem})
     * - layoutchild ({@link LayoutChildComponentSystem})
     * - layoutgroup ({@link LayoutGroupComponentSystem})
     * - light ({@link LightComponentSystem})
     * - model ({@link ModelComponentSystem})
     * - particlesystem ({@link ParticleSystemComponentSystem})
     * - rigidbody ({@link RigidBodyComponentSystem})
     * - render ({@link RenderComponentSystem})
     * - screen ({@link ScreenComponentSystem})
     * - script ({@link ScriptComponentSystem})
     * - scrollbar ({@link ScrollbarComponentSystem})
     * - scrollview ({@link ScrollViewComponentSystem})
     * - sound ({@link SoundComponentSystem})
     * - sprite ({@link SpriteComponentSystem})
     *
     * @type {ComponentSystemRegistry}
     * @example
     * // Set global gravity to zero
     * this.app.systems.rigidbody.gravity.set(0, 0, 0);
     * @example
     * // Set the global sound volume to 50%
     * this.app.systems.sound.volume = 0.5;
     */
    this.systems = new ComponentSystemRegistry();

    // create and register all required component systems
    appOptions.componentSystems.forEach((componentSystem) => {
        this.systems.add(new componentSystem(this));
    });

    /** @private */
    this._visibilityChangeHandler = this.onVisibilityChange.bind(this);

    // Depending on browser add the correct visibilitychange event and store the name of the
    // hidden attribute in this._hiddenAttr.
    if (typeof document !== 'undefined') {
        if (document.hidden !== undefined) {
            this._hiddenAttr = 'hidden';
            document.addEventListener('visibilitychange', this._visibilityChangeHandler, false);
        } else if (document.mozHidden !== undefined) {
            this._hiddenAttr = 'mozHidden';
            document.addEventListener('mozvisibilitychange', this._visibilityChangeHandler, false);
        } else if (document.msHidden !== undefined) {
            this._hiddenAttr = 'msHidden';
            document.addEventListener('msvisibilitychange', this._visibilityChangeHandler, false);
        } else if (document.webkitHidden !== undefined) {
            this._hiddenAttr = 'webkitHidden';
            document.addEventListener('webkitvisibilitychange', this._visibilityChangeHandler, false);
        }
    }

    // bind tick function to current scope
    /* eslint-disable-next-line no-use-before-define */
    this.tick = makeTick(this); // Circular linting issue as makeTick and Application reference each other
}
