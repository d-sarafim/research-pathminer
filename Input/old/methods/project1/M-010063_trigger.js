disable() {
    const body = this.body;
    if (!body) return;

    const systems = this.app.systems;
    const idx = systems.rigidbody._triggers.indexOf(this);
    if (idx > -1) {
        systems.rigidbody._triggers.splice(idx, 1);
    }
    systems.rigidbody.removeBody(body);

    // set the body's activation state to disable simulation so
    // that it properly deactivates after we remove it from the physics world
    body.forceActivationState(BODYSTATE_DISABLE_SIMULATION);
}
