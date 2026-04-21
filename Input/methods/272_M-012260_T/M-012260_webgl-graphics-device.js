draw(primitive, numInstances, keepBuffers) {
    const gl = this.gl;

    let sampler, samplerValue, texture, numTextures; // Samplers
    let uniform, scopeId, uniformVersion, programVersion; // Uniforms
    const shader = this.shader;
    if (!shader)
        return;
    const samplers = shader.impl.samplers;
    const uniforms = shader.impl.uniforms;

    // vertex buffers
    if (!keepBuffers) {
        this.setBuffers();
    }

    // Commit the shader program variables
    let textureUnit = 0;

    for (let i = 0, len = samplers.length; i < len; i++) {
        sampler = samplers[i];
        samplerValue = sampler.scopeId.value;
        if (!samplerValue) {

            // #if _DEBUG
            const samplerName = sampler.scopeId.name;
            if (samplerName === 'uSceneDepthMap' || samplerName === 'uDepthMap') {
                Debug.warnOnce(`A sampler ${samplerName} is used by the shader but a scene depth texture is not available. Use CameraComponent.requestSceneDepthMap to enable it.`);
            }
            if (samplerName === 'uSceneColorMap' || samplerName === 'texture_grabPass') {
                Debug.warnOnce(`A sampler ${samplerName} is used by the shader but a scene color texture is not available. Use CameraComponent.requestSceneColorMap to enable it.`);
            }
            // #endif

            Debug.errorOnce(`Shader [${shader.label}] requires texture sampler [${samplerName}] which has not been set, while rendering [${DebugGraphics.toString()}]`);

            // skip this draw call to avoid incorrect rendering / webgl errors
            return;
        }

        if (samplerValue instanceof Texture) {
            texture = samplerValue;
            this.setTexture(texture, textureUnit);

            // #if _DEBUG
            if (this.renderTarget) {
                // Set breakpoint here to debug "Source and destination textures of the draw are the same" errors
                if (this.renderTarget._samples < 2) {
                    if (this.renderTarget.colorBuffer && this.renderTarget.colorBuffer === texture) {
                        Debug.error("Trying to bind current color buffer as a texture", { renderTarget: this.renderTarget, texture });
                    } else if (this.renderTarget.depthBuffer && this.renderTarget.depthBuffer === texture) {
                        Debug.error("Trying to bind current depth buffer as a texture", { texture });
                    }
                }
            }
            // #endif

            if (sampler.slot !== textureUnit) {
                gl.uniform1i(sampler.locationId, textureUnit);
                sampler.slot = textureUnit;
            }
            textureUnit++;
        } else { // Array
            sampler.array.length = 0;
            numTextures = samplerValue.length;
            for (let j = 0; j < numTextures; j++) {
                texture = samplerValue[j];
                this.setTexture(texture, textureUnit);

                sampler.array[j] = textureUnit;
                textureUnit++;
            }
            gl.uniform1iv(sampler.locationId, sampler.array);
        }
    }

    // Commit any updated uniforms
    for (let i = 0, len = uniforms.length; i < len; i++) {
        uniform = uniforms[i];
        scopeId = uniform.scopeId;
        uniformVersion = uniform.version;
        programVersion = scopeId.versionObject.version;

        // Check the value is valid
        if (uniformVersion.globalId !== programVersion.globalId || uniformVersion.revision !== programVersion.revision) {
            uniformVersion.globalId = programVersion.globalId;
            uniformVersion.revision = programVersion.revision;

            // Call the function to commit the uniform value
            if (scopeId.value !== null) {
                this.commitFunction[uniform.dataType](uniform, scopeId.value);
            } else {
                // commented out till engine issue #4971 is sorted out
                // Debug.warnOnce(`Shader [${shader.label}] requires uniform [${uniform.scopeId.name}] which has not been set, while rendering [${DebugGraphics.toString()}]`);
            }
        }
    }

    if (this.webgl2 && this.transformFeedbackBuffer) {
        // Enable TF, start writing to out buffer
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.transformFeedbackBuffer.impl.bufferId);
        gl.beginTransformFeedback(gl.POINTS);
    }

    const mode = this.glPrimitive[primitive.type];
    const count = primitive.count;

    if (primitive.indexed) {
        const indexBuffer = this.indexBuffer;
        Debug.assert(indexBuffer.device === this, "The IndexBuffer was not created using current GraphicsDevice");

        const format = indexBuffer.impl.glFormat;
        const offset = primitive.base * indexBuffer.bytesPerIndex;

        if (numInstances > 0) {
            gl.drawElementsInstanced(mode, count, format, offset, numInstances);
        } else {
            gl.drawElements(mode, count, format, offset);
        }
    } else {
        const first = primitive.base;

        if (numInstances > 0) {
            gl.drawArraysInstanced(mode, first, count, numInstances);
        } else {
            gl.drawArrays(mode, first, count);
        }
    }

    if (this.webgl2 && this.transformFeedbackBuffer) {
        // disable TF
        gl.endTransformFeedback();
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    }

    this._drawCallsPerFrame++;

    // #if _PROFILER
    this._primsPerFrame[primitive.type] += primitive.count * (numInstances > 1 ? numInstances : 1);
    // #endif
}
