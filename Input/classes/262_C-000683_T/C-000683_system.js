class CollisionComponentSystem extends ComponentSystem {
    /**
     * Creates a new CollisionComponentSystem instance.
     *
     * @param {import('../../app-base.js').AppBase} app - The running {@link AppBase}.
     * @hideconstructor
     */
    constructor(app) {
        super(app);

        this.id = 'collision';

        this.ComponentType = CollisionComponent;
        this.DataType = CollisionComponentData;

        this.schema = _schema;

        this.implementations = { };

        this._triMeshCache = { };

        this.on('beforeremove', this.onBeforeRemove, this);
        this.on('remove', this.onRemove, this);
    }

    initializeComponentData(component, _data, properties) {
        properties = [
            'type',
            'halfExtents',
            'radius',
            'axis',
            'height',
            'shape',
            'model',
            'asset',
            'render',
            'renderAsset',
            'enabled',
            'linearOffset',
            'angularOffset'
        ];

        // duplicate the input data because we are modifying it
        const data = {};
        for (let i = 0, len = properties.length; i < len; i++) {
            const property = properties[i];
            data[property] = _data[property];
        }

        // asset takes priority over model
        // but they are both trying to change the mesh
        // so remove one of them to avoid conflicts
        let idx;
        if (_data.hasOwnProperty('asset')) {
            idx = properties.indexOf('model');
            if (idx !== -1) {
                properties.splice(idx, 1);
            }
            idx = properties.indexOf('render');
            if (idx !== -1) {
                properties.splice(idx, 1);
            }
        } else if (_data.hasOwnProperty('model')) {
            idx = properties.indexOf('asset');
            if (idx !== -1) {
                properties.splice(idx, 1);
            }
        }

        if (!data.type) {
            data.type = component.data.type;
        }
        component.data.type = data.type;

        if (Array.isArray(data.halfExtents)) {
            data.halfExtents = new Vec3(data.halfExtents);
        }

        if (Array.isArray(data.linearOffset)) {
            data.linearOffset = new Vec3(data.linearOffset);
        }

        if (Array.isArray(data.angularOffset)) {
            // Allow for euler angles to be passed as a 3 length array
            const values = data.angularOffset;
            if (values.length === 3) {
                data.angularOffset = new Quat().setFromEulerAngles(values[0], values[1], values[2]);
            } else {
                data.angularOffset = new Quat(data.angularOffset);
            }
        }

        const impl = this._createImplementation(data.type);
        impl.beforeInitialize(component, data);

        super.initializeComponentData(component, data, properties);

        impl.afterInitialize(component, data);
    }

    // Creates an implementation based on the collision type and caches it
    // in an internal implementations structure, before returning it.
    _createImplementation(type) {
        if (this.implementations[type] === undefined) {
            let impl;
            switch (type) {
                case 'box':
                    impl = new CollisionBoxSystemImpl(this);
                    break;
                case 'sphere':
                    impl = new CollisionSphereSystemImpl(this);
                    break;
                case 'capsule':
                    impl = new CollisionCapsuleSystemImpl(this);
                    break;
                case 'cylinder':
                    impl = new CollisionCylinderSystemImpl(this);
                    break;
                case 'cone':
                    impl = new CollisionConeSystemImpl(this);
                    break;
                case 'mesh':
                    impl = new CollisionMeshSystemImpl(this);
                    break;
                case 'compound':
                    impl = new CollisionCompoundSystemImpl(this);
                    break;
                default:
                    Debug.error(`_createImplementation: Invalid collision system type: ${type}`);
            }
            this.implementations[type] = impl;
        }

        return this.implementations[type];
    }

    // Gets an existing implementation for the specified entity
    _getImplementation(entity) {
        return this.implementations[entity.collision.data.type];
    }

    cloneComponent(entity, clone) {
        return this._getImplementation(entity).clone(entity, clone);
    }

    onBeforeRemove(entity, component) {
        this.implementations[component.data.type].beforeRemove(entity, component);
        component.onBeforeRemove();
    }

    onRemove(entity, data) {
        this.implementations[data.type].remove(entity, data);
    }

    updateCompoundChildTransform(entity) {
        // TODO
        // use updateChildTransform once it is exposed in ammo.js

        this._removeCompoundChild(entity.collision._compoundParent, entity.collision.data.shape);

        if (entity.enabled && entity.collision.enabled) {
            const transform = this._getNodeTransform(entity, entity.collision._compoundParent.entity);
            entity.collision._compoundParent.shape.addChildShape(transform, entity.collision.data.shape);
            Ammo.destroy(transform);
        }
    }

    _removeCompoundChild(collision, shape) {
        if (collision.shape.removeChildShape) {
            collision.shape.removeChildShape(shape);
        } else {
            const ind = collision._getCompoundChildShapeIndex(shape);
            if (ind !== null) {
                collision.shape.removeChildShapeByIndex(ind);
            }
        }
    }

    onTransformChanged(component, position, rotation, scale) {
        this.implementations[component.data.type].updateTransform(component, position, rotation, scale);
    }

    // Destroys the previous collision type and creates a new one based on the new type provided
    changeType(component, previousType, newType) {
        this.implementations[previousType].beforeRemove(component.entity, component);
        this.implementations[previousType].remove(component.entity, component.data);
        this._createImplementation(newType).reset(component, component.data);
    }

    // Recreates rigid bodies or triggers for the specified component
    recreatePhysicalShapes(component) {
        this.implementations[component.data.type].recreatePhysicalShapes(component);
    }

    _calculateNodeRelativeTransform(node, relative) {
        if (node === relative) {
            const scale = node.getWorldTransform().getScale();
            mat4.setScale(scale.x, scale.y, scale.z);
        } else {
            this._calculateNodeRelativeTransform(node.parent, relative);
            mat4.mul(node.getLocalTransform());
        }
    }

    _getNodeScaling(node) {
        const wtm = node.getWorldTransform();
        const scl = wtm.getScale();
        return new Ammo.btVector3(scl.x, scl.y, scl.z);
    }

    _getNodeTransform(node, relative) {
        let pos, rot;

        if (relative) {
            this._calculateNodeRelativeTransform(node, relative);

            pos = p1;
            rot = quat;

            mat4.getTranslation(pos);
            rot.setFromMat4(mat4);
        } else {
            pos = node.getPosition();
            rot = node.getRotation();
        }
        const ammoQuat = new Ammo.btQuaternion();
        const transform = new Ammo.btTransform();

        transform.setIdentity();
        const origin = transform.getOrigin();
        const component = node.collision;

        if (component && component._hasOffset) {
            const lo = component.data.linearOffset;
            const ao = component.data.angularOffset;
            const newOrigin = p2;

            quat.copy(rot).transformVector(lo, newOrigin);
            newOrigin.add(pos);
            quat.copy(rot).mul(ao);

            origin.setValue(newOrigin.x, newOrigin.y, newOrigin.z);
            ammoQuat.setValue(quat.x, quat.y, quat.z, quat.w);
        } else {
            origin.setValue(pos.x, pos.y, pos.z);
            ammoQuat.setValue(rot.x, rot.y, rot.z, rot.w);
        }

        transform.setRotation(ammoQuat);
        Ammo.destroy(ammoQuat);
        Ammo.destroy(origin);

        return transform;
    }

    destroy() {
        for (const key in this._triMeshCache) {
            Ammo.destroy(this._triMeshCache[key]);
        }

        this._triMeshCache = null;

        super.destroy();
    }
}
