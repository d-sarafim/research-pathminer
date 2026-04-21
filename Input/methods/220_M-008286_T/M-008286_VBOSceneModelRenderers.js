drawLayer(frameCtx, layer, renderPass, {colorUniform = false, incrementDrawState = false} = {}) {
    const maxTextureUnits = WEBGL_INFO.MAX_TEXTURE_IMAGE_UNITS;

    const scene = this._scene;
    const gl = scene.canvas.gl;
    const {_state: state, model} = layer;
    const {textureSet, origin, positionsDecodeMatrix} = state;
    const lightsState = scene._lightsState;
    const pointsMaterial = scene.pointsMaterial;
    const {camera} = model.scene;
    const {viewNormalMatrix, project} = camera;
    const viewMatrix = frameCtx.pickViewMatrix || camera.viewMatrix
    const {worldMatrix, worldNormalMatrix} = model;

    if (!this._program) {
        this._allocate();
        if (this.errors) {
            return;
        }
    }

    if (frameCtx.lastProgramId !== this._program.id) {
        frameCtx.lastProgramId = this._program.id;
        this._bindProgram(frameCtx);
    }

    if (this._vaoCache.has(layer)) {
        gl.bindVertexArray(this._vaoCache.get(layer));
    } else {
        this._vaoCache.set(layer, this._makeVAO(state))
    }

    let offset = 0;
    const mat4Size = 4 * 4;

    this._matricesUniformBlockBufferData.set(worldMatrix, 0);
    this._matricesUniformBlockBufferData.set(
        (origin) ? createRTCViewMat(viewMatrix, origin) : viewMatrix,
        offset += mat4Size,
    );
    this._matricesUniformBlockBufferData.set(frameCtx.pickProjMatrix || project.matrix, offset += mat4Size);
    this._matricesUniformBlockBufferData.set(positionsDecodeMatrix, offset += mat4Size);
    this._matricesUniformBlockBufferData.set(worldNormalMatrix, offset += mat4Size);
    this._matricesUniformBlockBufferData.set(viewNormalMatrix, offset += mat4Size);

    gl.bindBuffer(gl.UNIFORM_BUFFER, this._matricesUniformBlockBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, this._matricesUniformBlockBufferData, gl.DYNAMIC_DRAW);

    gl.bindBufferBase(
        gl.UNIFORM_BUFFER,
        this._matricesUniformBlockBufferBindingPoint,
        this._matricesUniformBlockBuffer);


    gl.uniform1i(this._uRenderPass, renderPass);

    this.setSectionPlanesStateUniforms(layer);

    if (scene.logarithmicDepthBufferEnabled) {
        if (this._uLogDepthBufFC) {
            const logDepthBufFC = 2.0 / (Math.log(frameCtx.pickZFar + 1.0) / Math.LN2); // TODO: Far from pick project matrix?
            gl.uniform1f(this._uLogDepthBufFC, logDepthBufFC);
        }
        if (this._uZFar) {
            gl.uniform1f(this._uZFar, scene.camera.project.far)
        }
    }

    if (this._uPickInvisible) {
        gl.uniform1i(this._uPickInvisible, frameCtx.pickInvisible);
    }

    if (this._uPickZNear) {
        gl.uniform1f(this._uPickZNear, frameCtx.pickZNear);
    }

    if (this._uPickZFar) {
        gl.uniform1f(this._uPickZFar, frameCtx.pickZFar);
    }

    if (this._uPositionsDecodeMatrix) {
        gl.uniformMatrix4fv(this._uPositionsDecodeMatrix, false, state.positionsDecodeMatrix);
    }

    if (this._uUVDecodeMatrix) {
        gl.uniformMatrix3fv(this._uUVDecodeMatrix, false, this._instancing ? state.uvDecodeMatrix : state.uvDecodeMatrix);
    }

    if (this._uIntensityRange && pointsMaterial.filterIntensity) {
        gl.uniform2f(this._uIntensityRange, pointsMaterial.minIntensity, pointsMaterial.maxIntensity);
    }

    if (this._uPointSize) {
        gl.uniform1f(this._uPointSize, pointsMaterial.pointSize);
    }

    if (this._uNearPlaneHeight) {
        const nearPlaneHeight = (scene.camera.projection === "ortho") ? 1.0 : (gl.drawingBufferHeight / (2 * Math.tan(0.5 * scene.camera.perspective.fov * Math.PI / 180.0)));
        gl.uniform1f(this._uNearPlaneHeight, nearPlaneHeight);
    }

    if (textureSet) {
        const {
            colorTexture,
            metallicRoughnessTexture,
            emissiveTexture,
            normalsTexture,
            occlusionTexture,
        } = textureSet;

        if (this._uColorMap && colorTexture) {
            this._program.bindTexture(this._uColorMap, colorTexture.texture, frameCtx.textureUnit);
            frameCtx.textureUnit = (frameCtx.textureUnit + 1) % maxTextureUnits;
        }
        if (this._uMetallicRoughMap && metallicRoughnessTexture) {
            this._program.bindTexture(this._uMetallicRoughMap, metallicRoughnessTexture.texture, frameCtx.textureUnit);
            frameCtx.textureUnit = (frameCtx.textureUnit + 1) % maxTextureUnits;
        }
        if (this._uEmissiveMap && emissiveTexture) {
            this._program.bindTexture(this._uEmissiveMap, emissiveTexture.texture, frameCtx.textureUnit);
            frameCtx.textureUnit = (frameCtx.textureUnit + 1) % maxTextureUnits;
        }
        if (this._uNormalMap && normalsTexture) {
            this._program.bindTexture(this._uNormalMap, normalsTexture.texture, frameCtx.textureUnit);
            frameCtx.textureUnit = (frameCtx.textureUnit + 1) % maxTextureUnits;
        }
        if (this._uAOMap && occlusionTexture) {
            this._program.bindTexture(this._uAOMap, occlusionTexture.texture, frameCtx.textureUnit);
            frameCtx.textureUnit = (frameCtx.textureUnit + 1) % maxTextureUnits;
        }

    }

    if (lightsState.reflectionMaps.length > 0 && lightsState.reflectionMaps[0].texture && this._uReflectionMap) {
        this._program.bindTexture(this._uReflectionMap, lightsState.reflectionMaps[0].texture, frameCtx.textureUnit);
        frameCtx.textureUnit = (frameCtx.textureUnit + 1) % maxTextureUnits;
        frameCtx.bindTexture++;
    }

    if (lightsState.lightMaps.length > 0 && lightsState.lightMaps[0].texture && this._uLightMap) {
        this._program.bindTexture(this._uLightMap, lightsState.lightMaps[0].texture, frameCtx.textureUnit);
        frameCtx.textureUnit = (frameCtx.textureUnit + 1) % maxTextureUnits;
        frameCtx.bindTexture++;
    }

    if (this._withSAO) {
        const sao = scene.sao;
        const saoEnabled = sao.possible;
        if (saoEnabled) {
            const viewportWidth = gl.drawingBufferWidth;
            const viewportHeight = gl.drawingBufferHeight;
            tempVec4[0] = viewportWidth;
            tempVec4[1] = viewportHeight;
            tempVec4[2] = sao.blendCutoff;
            tempVec4[3] = sao.blendFactor;
            gl.uniform4fv(this._uSAOParams, tempVec4);
            this._program.bindTexture(this._uOcclusionTexture, frameCtx.occlusionTexture, frameCtx.textureUnit);
            frameCtx.textureUnit = (frameCtx.textureUnit + 1) % maxTextureUnits;
            frameCtx.bindTexture++;
        }
    }

    if (colorUniform) {
        const colorKey = this._edges ? "edgeColor" : "fillColor";
        const alphaKey = this._edges ? "edgeAlpha" : "fillAlpha";

        if (renderPass === RENDER_PASSES[`${this._edges ? "EDGES" : "SILHOUETTE"}_XRAYED`]) {
            const material = scene.xrayMaterial._state;
            const color = material[colorKey];
            const alpha = material[alphaKey];
            gl.uniform4f(this._uColor, color[0], color[1], color[2], alpha);

        } else if (renderPass === RENDER_PASSES[`${this._edges ? "EDGES" : "SILHOUETTE"}_HIGHLIGHTED`]) {
            const material = scene.highlightMaterial._state;
            const color = material[colorKey];
            const alpha = material[alphaKey];
            gl.uniform4f(this._uColor, color[0], color[1], color[2], alpha);

        } else if (renderPass === RENDER_PASSES[`${this._edges ? "EDGES" : "SILHOUETTE"}_SELECTED`]) {
            const material = scene.selectedMaterial._state;
            const color = material[colorKey];
            const alpha = material[alphaKey];
            gl.uniform4f(this._uColor, color[0], color[1], color[2], alpha);

        } else {
            gl.uniform4fv(this._uColor, this._edges ? edgesDefaultColor : defaultColor);
        }
    }

    this._draw({ state, frameCtx, incrementDrawState});

    gl.bindVertexArray(null);
}
