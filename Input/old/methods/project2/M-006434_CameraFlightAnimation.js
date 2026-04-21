flyTo(params, callback, scope) {

    params = params || this.scene;

    if (this._flying) {
        this.stop();
    }

    this._flying = false;
    this._flyingEye = false;
    this._flyingLook = false;
    this._flyingEyeLookUp = false;

    this._callback = callback;
    this._callbackScope = scope;

    const camera = this.scene.camera;
    const flyToProjection = (!!params.projection) && (params.projection !== camera.projection);

    this._eye1[0] = camera.eye[0];
    this._eye1[1] = camera.eye[1];
    this._eye1[2] = camera.eye[2];

    this._look1[0] = camera.look[0];
    this._look1[1] = camera.look[1];
    this._look1[2] = camera.look[2];

    this._up1[0] = camera.up[0];
    this._up1[1] = camera.up[1];
    this._up1[2] = camera.up[2];

    this._orthoScale1 = camera.ortho.scale;
    this._orthoScale2 = params.orthoScale || this._orthoScale1;

    let aabb;
    let eye;
    let look;
    let up;
    let componentId;

    if (params.aabb) {
        aabb = params.aabb;

    } else if (params.length === 6) {
        aabb = params;

    } else if ((params.eye && params.look) || params.up) {
        eye = params.eye;
        look = params.look;
        up = params.up;

    } else if (params.eye) {
        eye = params.eye;

    } else if (params.look) {
        look = params.look;

    } else { // Argument must be an instance or ID of a Component (subtype)

        let component = params;

        if (utils.isNumeric(component) || utils.isString(component)) {

            componentId = component;
            component = this.scene.components[componentId];

            if (!component) {
                this.error("Component not found: " + utils.inQuotes(componentId));
                if (callback) {
                    if (scope) {
                        callback.call(scope);
                    } else {
                        callback();
                    }
                }
                return;
            }
        }
        if (!flyToProjection) {
            aabb = component.aabb || this.scene.aabb;
        }
    }

    const poi = params.poi;

    if (aabb) {

        if (aabb[3] < aabb[0] || aabb[4] < aabb[1] || aabb[5] < aabb[2]) { // Don't fly to an inverted boundary
            return;
        }

        if (aabb[3] === aabb[0] && aabb[4] === aabb[1] && aabb[5] === aabb[2]) { // Don't fly to an empty boundary
            return;
        }

        aabb = aabb.slice();
        const aabbCenter = math.getAABB3Center(aabb);

        this._look2 = poi || aabbCenter;

        const eyeLookVec = math.subVec3(this._eye1, this._look1, tempVec3);
        const eyeLookVecNorm = math.normalizeVec3(eyeLookVec);
        const diag = poi ? math.getAABB3DiagPoint(aabb, poi) : math.getAABB3Diag(aabb);
        const fitFOV = params.fitFOV || this._fitFOV;
        const sca = Math.abs(diag / Math.tan(fitFOV * math.DEGTORAD));

        this._orthoScale2 = diag * 1.1;

        this._eye2[0] = this._look2[0] + (eyeLookVecNorm[0] * sca);
        this._eye2[1] = this._look2[1] + (eyeLookVecNorm[1] * sca);
        this._eye2[2] = this._look2[2] + (eyeLookVecNorm[2] * sca);

        this._up2[0] = this._up1[0];
        this._up2[1] = this._up1[1];
        this._up2[2] = this._up1[2];

        this._flyingEyeLookUp = true;

    } else if (eye || look || up) {

        this._flyingEyeLookUp = !!eye && !!look && !!up;
        this._flyingEye = !!eye && !look;
        this._flyingLook = !!look && !eye;

        if (eye) {
            this._eye2[0] = eye[0];
            this._eye2[1] = eye[1];
            this._eye2[2] = eye[2];
        }

        if (look) {
            this._look2[0] = look[0];
            this._look2[1] = look[1];
            this._look2[2] = look[2];
        }

        if (up) {
            this._up2[0] = up[0];
            this._up2[1] = up[1];
            this._up2[2] = up[2];
        }
    }

    if (flyToProjection) {

        if (params.projection === "ortho" && camera.projection !== "ortho") {
            this._projection2 = "ortho";
            this._projMatrix1 = camera.projMatrix.slice();
            this._projMatrix2 = camera.ortho.matrix.slice();
            camera.projection = "customProjection";
        }

        if (params.projection === "perspective" && camera.projection !== "perspective") {
            this._projection2 = "perspective";
            this._projMatrix1 = camera.projMatrix.slice();
            this._projMatrix2 = camera.perspective.matrix.slice();
            camera.projection = "customProjection";
        }
    } else {
        this._projection2 = null;
    }

    this.fire("started", params, true);

    this._time1 = Date.now();
    this._time2 = this._time1 + (params.duration ? params.duration * 1000 : this._duration);

    this._flying = true; // False as soon as we stop

    core.scheduleTask(this._update, this);
}
