_update() {

    if (!this._visible) {
        return;
    }

    const scene = this.plugin.viewer.scene;

    if (this._wpDirty) {

        this._wp[0] = this._originWorld[0];
        this._wp[1] = this._originWorld[1];
        this._wp[2] = this._originWorld[2];
        this._wp[3] = 1.0;

        this._wp[4] = this._cornerWorld[0];
        this._wp[5] = this._cornerWorld[1];
        this._wp[6] = this._cornerWorld[2];
        this._wp[7] = 1.0;

        this._wp[8] = this._targetWorld[0];
        this._wp[9] = this._targetWorld[1];
        this._wp[10] = this._targetWorld[2];
        this._wp[11] = 1.0;

        this._wpDirty = false;
        this._vpDirty = true;
    }

    if (this._vpDirty) {

        math.transformPositions4(scene.camera.viewMatrix, this._wp, this._vp);

        this._vp[3] = 1.0;
        this._vp[7] = 1.0;
        this._vp[11] = 1.0;

        this._vpDirty = false;
        this._cpDirty = true;
    }

    if (this._cpDirty) {

        const near = -0.3;
        const zOrigin = this._originMarker.viewPos[2];
        const zCorner = this._cornerMarker.viewPos[2];
        const zTarget = this._targetMarker.viewPos[2];

        if (zOrigin > near || zCorner > near || zTarget > near) {

            this._originDot.setVisible(false);
            this._cornerDot.setVisible(false);
            this._targetDot.setVisible(false);

            this._originWire.setVisible(false);
            this._targetWire.setVisible(false);

            this._angleLabel.setCulled(true);

            return;
        }

        math.transformPositions4(scene.camera.project.matrix, this._vp, this._pp);

        var pp = this._pp;
        var cp = this._cp;

        var canvas = scene.canvas.canvas;
        var offsets = canvas.getBoundingClientRect();
        const containerOffsets = this._container.getBoundingClientRect();
        var top = offsets.top - containerOffsets.top;
        var left = offsets.left - containerOffsets.left;
        var aabb = scene.canvas.boundary;
        var canvasWidth = aabb[2];
        var canvasHeight = aabb[3];
        var j = 0;

        for (var i = 0, len = pp.length; i < len; i += 4) {
            cp[j] = left + Math.floor((1 + pp[i + 0] / pp[i + 3]) * canvasWidth / 2);
            cp[j + 1] = top + Math.floor((1 - pp[i + 1] / pp[i + 3]) * canvasHeight / 2);
            j += 2;
        }

        this._originDot.setPos(cp[0], cp[1]);
        this._cornerDot.setPos(cp[2], cp[3]);
        this._targetDot.setPos(cp[4], cp[5]);

        this._originWire.setStartAndEnd(cp[0], cp[1], cp[2], cp[3]);
        this._targetWire.setStartAndEnd(cp[2], cp[3], cp[4], cp[5]);

        this._angleLabel.setPosBetweenWires(cp[0], cp[1], cp[2], cp[3], cp[4], cp[5]);

        math.subVec3(this._originWorld, this._cornerWorld, originVec);
        math.subVec3(this._targetWorld, this._cornerWorld, targetVec);

        var validVecs =
            (originVec[0] !== 0 || originVec[1] !== 0 || originVec[2] !== 0) &&
            (targetVec[0] !== 0 || targetVec[1] !== 0 || targetVec[2] !== 0);

        if (validVecs) {

            const tilde = this._approximate ? " ~ " : " = ";

            math.normalizeVec3(originVec);
            math.normalizeVec3(targetVec);
            const angle = Math.abs(math.angleVec3(originVec, targetVec));
            this._angle = angle / math.DEGTORAD;
            this._angleLabel.setText(tilde + this._angle.toFixed(2) + "°");
        } else {
            this._angleLabel.setText("");
        }

        // this._angleLabel.setText((Math.abs(math.lenVec3(math.subVec3(this._targetWorld, this._originWorld, distVec3)) * scale).toFixed(2)) + unitAbbrev);

        this._originDot.setVisible(this._visible && this._originVisible);
        this._cornerDot.setVisible(this._visible && this._cornerVisible);
        this._targetDot.setVisible(this._visible && this._targetVisible);

        this._originWire.setVisible(this._visible && this._originWireVisible);
        this._targetWire.setVisible(this._visible && this._targetWireVisible);

        this._angleLabel.setCulled(!(this._visible && this._angleVisible && this.labelsVisible));

        this._cpDirty = false;
    }
}
