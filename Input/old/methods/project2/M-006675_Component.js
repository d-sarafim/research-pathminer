_attach(params) {

    const name = params.name;

    if (!name) {
        this.error("Component 'name' expected");
        return;
    }

    let component = params.component;
    const sceneDefault = params.sceneDefault;
    const sceneSingleton = params.sceneSingleton;
    const type = params.type;
    const on = params.on;
    const recompiles = params.recompiles !== false;

    // True when child given as config object, where parent manages its instantiation and destruction
    let managingLifecycle = false;

    if (component) {

        if (utils.isNumeric(component) || utils.isString(component)) {

            // Component ID given
            // Both numeric and string IDs are supported

            const id = component;

            component = this.scene.components[id];

            if (!component) {

                // Quote string IDs in errors

                this.error("Component not found: " + utils.inQuotes(id));
                return;
            }
        }
    }

    if (!component) {

        if (sceneSingleton === true) {

            // Using the first instance of the component type we find

            const instances = this.scene.types[type];
            for (const id2 in instances) {
                if (instances.hasOwnProperty) {
                    component = instances[id2];
                    break;
                }
            }

            if (!component) {
                this.error("Scene has no default component for '" + name + "'");
                return null;
            }

        } else if (sceneDefault === true) {

            // Using a default scene component

            component = this.scene[name];

            if (!component) {
                this.error("Scene has no default component for '" + name + "'");
                return null;
            }
        }
    }

    if (component) {

        if (component.scene.id !== this.scene.id) {
            this.error("Not in same scene: " + component.type + " " + utils.inQuotes(component.id));
            return;
        }

        if (type) {

            if (!component.isType(type)) {
                this.error("Expected a " + type + " type or subtype: " + component.type + " " + utils.inQuotes(component.id));
                return;
            }
        }
    }

    if (!this._attachments) {
        this._attachments = {};
    }

    const oldComponent = this._attached[name];
    let subs;
    let i;
    let len;

    if (oldComponent) {

        if (component && oldComponent.id === component.id) {

            // Reject attempt to reattach same component
            return;
        }

        const oldAttachment = this._attachments[oldComponent.id];

        // Unsubscribe from events on old component

        subs = oldAttachment.subs;

        for (i = 0, len = subs.length; i < len; i++) {
            oldComponent.off(subs[i]);
        }

        delete this._attached[name];
        delete this._attachments[oldComponent.id];

        const onDetached = oldAttachment.params.onDetached;
        if (onDetached) {
            if (utils.isFunction(onDetached)) {
                onDetached(oldComponent);
            } else {
                onDetached.scope ? onDetached.callback.call(onDetached.scope, oldComponent) : onDetached.callback(oldComponent);
            }
        }

        if (oldAttachment.managingLifecycle) {

            // Note that we just unsubscribed from all events fired by the child
            // component, so destroying it won't fire events back at us now.

            oldComponent.destroy();
        }
    }

    if (component) {

        // Set and publish the new component on this component

        const attachment = {
            params: params,
            component: component,
            subs: [],
            managingLifecycle: managingLifecycle
        };

        attachment.subs.push(
            component.once("destroyed",
                function () {
                    attachment.params.component = null;
                    this._attach(attachment.params);
                },
                this));

        if (recompiles) {
            attachment.subs.push(
                component.on("dirty",
                    function () {
                        this.fire("dirty", this);
                    },
                    this));
        }

        this._attached[name] = component;
        this._attachments[component.id] = attachment;

        // Bind destruct listener to new component to remove it
        // from this component when destroyed

        const onAttached = params.onAttached;
        if (onAttached) {
            if (utils.isFunction(onAttached)) {
                onAttached(component);
            } else {
                onAttached.scope ? onAttached.callback.call(onAttached.scope, component) : onAttached.callback(component);
            }
        }

        if (on) {

            let event;
            let subIdr;
            let callback;
            let scope;

            for (event in on) {
                if (on.hasOwnProperty(event)) {

                    subIdr = on[event];

                    if (utils.isFunction(subIdr)) {
                        callback = subIdr;
                        scope = null;
                    } else {
                        callback = subIdr.callback;
                        scope = subIdr.scope;
                    }

                    if (!callback) {
                        continue;
                    }

                    attachment.subs.push(component.on(event, callback, scope));
                }
            }
        }
    }

    if (recompiles) {
        this.fire("dirty", this); // FIXME: May trigger spurous mesh recompilations unless able to limit with param?
    }

    this.fire(name, component); // Component can be null

    return component;
}
