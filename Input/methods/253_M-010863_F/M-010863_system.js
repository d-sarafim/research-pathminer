constructor(app) {
    super(app);

    this.id = 'script';

    this.ComponentType = ScriptComponent;
    this.DataType = ScriptComponentData;

    // list of all entities script components
    // we are using pc.SortedLoopArray because it is
    // safe to modify while looping through it
    this._components = new SortedLoopArray({
        sortBy: '_executionOrder'
    });

    // holds all the enabled script components
    // (whose entities are also enabled). We are using pc.SortedLoopArray
    // because it is safe to modify while looping through it. This array often
    // change during update and postUpdate loops as entities and components get
    // enabled or disabled
    this._enabledComponents = new SortedLoopArray({
        sortBy: '_executionOrder'
    });


    // if true then we are currently preloading scripts
    this.preloading = true;

    this.on('beforeremove', this._onBeforeRemove, this);
    this.app.systems.on('initialize', this._onInitialize, this);
    this.app.systems.on('postInitialize', this._onPostInitialize, this);
    this.app.systems.on('update', this._onUpdate, this);
    this.app.systems.on('postUpdate', this._onPostUpdate, this);
}
