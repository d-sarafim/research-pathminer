drawLayer(frameCtx, batchingLayer, renderPass) {

    const model = batchingLayer.model;
    const scene = model.scene;
    const camera = scene.camera;
    const gl = scene.canvas.gl;
    const state = batchingLayer._state;
    const origin = batchingLayer._state.origin;
    let cameraEye = camera.eye;

    frameCtx.snapPickOrigin[0] = origin[0];
    frameCtx.snapPickOrigin[1] = origin[1];
    frameCtx.snapPickOrigin[2] = origin[2];

    const aabb = batchingLayer.aabb;
    const coordinateDivider = [
        math.safeInv(aabb[3] - aabb[0]) * math.MAX_INT,
        math.safeInv(aabb[4] - aabb[1]) * math.MAX_INT,
        math.safeInv(aabb[5] - aabb[2]) * math.MAX_INT,
    ];

    frameCtx.snapPickCoordinateScale[0] = math.safeInv(coordinateDivider[0]);
    frameCtx.snapPickCoordinateScale[1] = math.safeInv(coordinateDivider[1]);
    frameCtx.snapPickCoordinateScale[2] = math.safeInv(coordinateDivider[2]);

    if (!this._program) {
        this._allocate();
        if (this.errors) {
            return;
        }
    }

    if (frameCtx.lastProgramId !== this._program.id) {
        frameCtx.lastProgramId = this._program.id;
        this._bindProgram();
    }

    if (frameCtx.pickViewMatrix) {
        cameraEye = frameCtx.pickOrigin || cameraEye;
    }

    const originCameraEye = [
        cameraEye[0] - origin[0],
        cameraEye[1] - origin[1],
        cameraEye[2] - origin[2],
    ];

    gl.uniform3fv(this._uCameraEyeRtc, originCameraEye);

    gl.uniform2fv(this.uVectorA, frameCtx.snapVectorA);
    gl.uniform2fv(this.uInverseVectorAB, frameCtx.snapInvVectorAB);
    gl.uniform1i(this._uLayerNumber, frameCtx.snapPickLayerNumber);
    gl.uniform3fv(this._uCoordinateScaler, coordinateDivider);
    gl.uniform1i(this._uRenderPass, renderPass);

    gl.uniform1i(this._uPickInvisible, frameCtx.pickInvisible);
    gl.uniform1i(this._uSolid, batchingLayer.solid);

    const pickViewMatrix = frameCtx.pickViewMatrix || camera.viewMatrix;
    const viewMatrix = origin ? createRTCViewMat(pickViewMatrix, origin) : pickViewMatrix;

    gl.uniformMatrix4fv(this._uWorldMatrix, false, model.worldMatrix);
    gl.uniformMatrix4fv(this._uViewMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(this._uProjMatrix, false, camera.projMatrix);

    if (scene.logarithmicDepthBufferEnabled) {
        const logDepthBufFC = 2.0 / (Math.log(frameCtx.pickZFar + 1.0) / Math.LN2); // TODO: Far from pick project matrix?
        gl.uniform1f(this._uLogDepthBufFC, logDepthBufFC);
    }

    const numSectionPlanes = scene._sectionPlanesState.sectionPlanes.length;
    if (numSectionPlanes > 0) {
        const sectionPlanes = scene._sectionPlanesState.sectionPlanes;
        const baseIndex = batchingLayer.layerIndex * numSectionPlanes;
        const renderFlags = model.renderFlags;
        for (let sectionPlaneIndex = 0; sectionPlaneIndex < numSectionPlanes; sectionPlaneIndex++) {
            const sectionPlaneUniforms = this._uSectionPlanes[sectionPlaneIndex];
            if (sectionPlaneUniforms) {
                const active = renderFlags.sectionPlanesActivePerLayer[baseIndex + sectionPlaneIndex];
                gl.uniform1i(sectionPlaneUniforms.active, active ? 1 : 0);
                if (active) {
                    const sectionPlane = sectionPlanes[sectionPlaneIndex];
                    if (origin) {
                        const rtcSectionPlanePos = getPlaneRTCPos(sectionPlane.dist, sectionPlane.dir, origin, tempVec3a);
                        gl.uniform3fv(sectionPlaneUniforms.pos, rtcSectionPlanePos);
                    } else {
                        gl.uniform3fv(sectionPlaneUniforms.pos, sectionPlane.pos);
                    }
                    gl.uniform3fv(sectionPlaneUniforms.dir, sectionPlane.dir);
                }
            }
        }
    }

    //=============================================================
    // TODO: Use drawElements count and offset to draw only one entity
    //=============================================================

    gl.uniformMatrix4fv(this._uPositionsDecodeMatrix, false, batchingLayer._state.positionsDecodeMatrix);

    this._aPosition.bindArrayBuffer(state.positionsBuf);

    if (this._aOffset) {
        this._aOffset.bindArrayBuffer(state.offsetsBuf);
    }

    if (this._aFlags) {
        this._aFlags.bindArrayBuffer(state.flagsBuf);
    }

    state.indicesBuf.bind();
    gl.drawElements(gl.TRIANGLES, state.indicesBuf.numItems, state.indicesBuf.itemType, 0);
    state.indicesBuf.unbind();
}
