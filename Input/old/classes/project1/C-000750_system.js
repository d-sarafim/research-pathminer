class ComponentSystem extends EventHandler {
    /**
     * Create a new ComponentSystem instance.
     *
     * @param {import('../app-base.js').AppBase} app - The application managing this system.
     */
    constructor(app) {
        super();

        this.app = app;

        // The store where all ComponentData objects are kept
        this.store = {};
        this.schema = [];
    }

    /**
     * Create new {@link Component} and component data instances and attach them to the entity.
     *
     * @param {import('../entity.js').Entity} entity - The Entity to attach this component to.
     * @param {object} [data] - The source data with which to create the component.
     * @returns {import('./component.js').Component} Returns a Component of type defined by the
     * component system.
     * @example
     * const entity = new pc.Entity(app);
     * app.systems.model.addComponent(entity, { type: 'box' });
     * // entity.model is now set to a pc.ModelComponent
     * @ignore
     */
    addComponent(entity, data = {}) {
        const component = new this.ComponentType(this, entity);
        const componentData = new this.DataType();

        this.store[entity.getGuid()] = {
            entity: entity,
            data: componentData
        };

        entity[this.id] = component;
        entity.c[this.id] = component;

        this.initializeComponentData(component, data, []);

        this.fire('add', entity, component);

        return component;
    }

    /**
     * Remove the {@link Component} from the entity and delete the associated component data.
     *
     * @param {import('../entity.js').Entity} entity - The entity to remove the component from.
     * @example
     * app.systems.model.removeComponent(entity);
     * // entity.model === undefined
     * @ignore
     */
    removeComponent(entity) {
        const record = this.store[entity.getGuid()];
        const component = entity.c[this.id];

        this.fire('beforeremove', entity, component);

        delete this.store[entity.getGuid()];

        entity[this.id] = undefined;
        delete entity.c[this.id];

        this.fire('remove', entity, record.data);
    }

    /**
     * Create a clone of component. This creates a copy of all component data variables.
     *
     * @param {import('../entity.js').Entity} entity - The entity to clone the component from.
     * @param {import('../entity.js').Entity} clone - The entity to clone the component into.
     * @returns {import('./component.js').Component} The newly cloned component.
     * @ignore
     */
    cloneComponent(entity, clone) {
        // default clone is just to add a new component with existing data
        const src = this.store[entity.getGuid()];
        return this.addComponent(clone, src.data);
    }

    /**
     * Called during {@link ComponentSystem#addComponent} to initialize the component data in the
     * store. This can be overridden by derived Component Systems and either called by the derived
     * System or replaced entirely.
     *
     * @param {import('./component.js').Component} component - The component being initialized.
     * @param {object} data - The data block used to initialize the component.
     * @param {Array<string | {name: string, type: string}>} properties - The array of property
     * descriptors for the component. A descriptor can be either a plain property name, or an
     * object specifying the name and type.
     * @ignore
     */
    initializeComponentData(component, data = {}, properties) {
        // initialize
        for (let i = 0, len = properties.length; i < len; i++) {
            const descriptor = properties[i];
            let name, type;

            // If the descriptor is an object, it will have `name` and `type` members
            if (typeof descriptor === 'object') {
                name = descriptor.name;
                type = descriptor.type;
            } else {
                // Otherwise, the descriptor is just the property name
                name = descriptor;
                type = undefined;
            }

            let value = data[name];

            if (value !== undefined) {
                // If we know the intended type of the value, convert the raw data
                // into an instance of the specified type.
                if (type !== undefined) {
                    value = convertValue(value, type);
                }

                component[name] = value;
            } else {
                component[name] = component.data[name];
            }
        }

        // after component is initialized call onEnable
        if (component.enabled && component.entity.enabled) {
            component.onEnable();
        }
    }

    /**
     * Searches the component schema for properties that match the specified type.
     *
     * @param {string} type - The type to search for.
     * @returns {string[]|object[]} An array of property descriptors matching the specified type.
     * @ignore
     */
    getPropertiesOfType(type) {
        const matchingProperties = [];
        const schema = this.schema || [];

        schema.forEach(function (descriptor) {
            if (descriptor && typeof descriptor === 'object' && descriptor.type === type) {
                matchingProperties.push(descriptor);
            }
        });

        return matchingProperties;
    }

    destroy() {
        this.off();
    }
}
