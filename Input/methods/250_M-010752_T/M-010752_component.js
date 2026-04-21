createBody() {
    const entity = this.entity;
    let shape;

    if (entity.collision) {
        shape = entity.collision.shape;

        // if a trigger was already created from the collision system
        // destroy it
        if (entity.trigger) {
            entity.trigger.destroy();
            delete entity.trigger;
        }
    }

    if (shape) {
        if (this._body)
            this.system.onRemove(entity, this);

        const mass = this._type === BODYTYPE_DYNAMIC ? this._mass : 0;

        this._getEntityTransform(_ammoTransform);

        const body = this.system.createBody(mass, shape, _ammoTransform);

        body.setRestitution(this._restitution);
        body.setFriction(this._friction);
        body.setRollingFriction(this._rollingFriction);
        body.setDamping(this._linearDamping, this._angularDamping);

        if (this._type === BODYTYPE_DYNAMIC) {
            const linearFactor = this._linearFactor;
            _ammoVec1.setValue(linearFactor.x, linearFactor.y, linearFactor.z);
            body.setLinearFactor(_ammoVec1);

            const angularFactor = this._angularFactor;
            _ammoVec1.setValue(angularFactor.x, angularFactor.y, angularFactor.z);
            body.setAngularFactor(_ammoVec1);
        } else if (this._type === BODYTYPE_KINEMATIC) {
            body.setCollisionFlags(body.getCollisionFlags() | BODYFLAG_KINEMATIC_OBJECT);
            body.setActivationState(BODYSTATE_DISABLE_DEACTIVATION);
        }

        body.entity = entity;

        this.body = body;

        if (this.enabled && entity.enabled) {
            this.enableSimulation();
        }
    }
}
