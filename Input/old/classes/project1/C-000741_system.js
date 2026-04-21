class ScrollbarComponentSystem extends ComponentSystem {
    /**
     * Create a new ScrollbarComponentSystem.
     *
     * @param {import('../../app-base.js').AppBase} app - The application.
     * @hideconstructor
     */
    constructor(app) {
        super(app);

        this.id = 'scrollbar';

        this.ComponentType = ScrollbarComponent;
        this.DataType = ScrollbarComponentData;

        this.schema = _schema;

        this.on('beforeremove', this._onRemoveComponent, this);
    }

    initializeComponentData(component, data, properties) {
        super.initializeComponentData(component, data, _schema);
    }

    _onRemoveComponent(entity, component) {
        component.onRemove();
    }
}
