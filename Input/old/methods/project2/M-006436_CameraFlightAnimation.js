_jumpTo(params) {

    if (this._flying) {
        this.stop();
    }

    const camera = this.scene.camera;

    var aabb;
    var componentId;
    var newEye;
    var newLook;
    var newUp;

    if (params.aabb) { // Boundary3D
        aabb = params.aabb;

    } else if (params.length === 6) { // AABB
        aabb = params;

    } else if (params.eye || params.look || params.up) { // Camera pose
        newEye = params.eye;
        newLook = params.look;
        newUp = params.up;

    } else { // Argument must be an instance or ID of a Component (subtype)

        let component = params;

        if (utils.isNumeric(component) || utils.isString(component)) {
            componentId = component;
            component = this.scene.components[componentId];
            if (!component) {
                this.error("Component not found: " + utils.inQuotes(componentId));
                return;
            }
        }
        aabb = component.aabb || this.scene.aabb;
    }

    const poi = params.poi;

    if (aabb) {

        if (aabb[3] <= aabb[0] || aabb[4] <= aabb[1] || aabb[5] <= aabb[2]) { // Don't fly to an empty boundary
            return;
        }

        var diag = poi ? math.getAABB3DiagPoint(aabb, poi) : math.getAABB3Diag(aabb);

        newLook = poi || math.getAABB3Center(aabb, newLook);

        if (this._trail) {
            math.subVec3(camera.look, newLook, newLookEyeVec);
        } else {
            math.subVec3(camera.eye, camera.look, newLookEyeVec);
        }

        math.normalizeVec3(newLookEyeVec);
        let dist;
        const fit = (params.fit !== undefined) ? params.fit : this._fit;

        if (fit) {
            dist = Math.abs((diag) / Math.tan((params.fitFOV || this._fitFOV) * math.DEGTORAD));

        } else {
            dist = math.lenVec3(math.subVec3(camera.eye, camera.look, tempVec3));
        }

        math.mulVec3Scalar(newLookEyeVec, dist);

        camera.eye = math.addVec3(newLook, newLookEyeVec, tempVec3);
        camera.look = newLook;

        this.scene.camera.ortho.scale = diag * 1.1;

    } else if (newEye || newLook || newUp) {

        if (newEye) {
            camera.eye = newEye;
        }
        if (newLook) {
            camera.look = newLook;
        }
        if (newUp) {
            camera.up = newUp;
        }
    }

    if (params.projection) {
        camera.projection = params.projection;
    }
}
