class WebGLHelper extends Disposable {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    super();
    options = options || {};

    /** @private */
    this.boundHandleWebGLContextLost_ = this.handleWebGLContextLost.bind(this);

    /** @private */
    this.boundHandleWebGLContextRestored_ =
      this.handleWebGLContextRestored.bind(this);

    /**
     * @private
     * @type {string}
     */
    this.canvasCacheKey_ = options.canvasCacheKey
      ? getSharedCanvasCacheKey(options.canvasCacheKey)
      : getUniqueCanvasCacheKey();

    /**
     * @private
     * @type {WebGLRenderingContext}
     */
    this.gl_ = getOrCreateContext(this.canvasCacheKey_);

    /**
     * @private
     * @type {!Object<string, BufferCacheEntry>}
     */
    this.bufferCache_ = {};

    /**
     * @private
     * @type {Object<string, Object>}
     */
    this.extensionCache_ = {};

    /**
     * @private
     * @type {WebGLProgram}
     */
    this.currentProgram_ = null;

    /**
     * @private
     * @type boolean
     */
    this.needsToBeRecreated_ = false;

    const canvas = this.gl_.canvas;

    canvas.addEventListener(
      ContextEventType.LOST,
      this.boundHandleWebGLContextLost_
    );
    canvas.addEventListener(
      ContextEventType.RESTORED,
      this.boundHandleWebGLContextRestored_
    );

    /**
     * @private
     * @type {import("../transform.js").Transform}
     */
    this.offsetRotateMatrix_ = createTransform();

    /**
     * @private
     * @type {import("../transform.js").Transform}
     */
    this.offsetScaleMatrix_ = createTransform();

    /**
     * @private
     * @type {Array<number>}
     */
    this.tmpMat4_ = create();

    /**
     * @private
     * @type {Object<string, Object<string, WebGLUniformLocation>>}
     */
    this.uniformLocationsByProgram_ = {};

    /**
     * @private
     * @type {Object<string, Object<string, number>>}
     */
    this.attribLocationsByProgram_ = {};

    /**
     * Holds info about custom uniforms used in the post processing pass.
     * If the uniform is a texture, the WebGL Texture object will be stored here.
     * @type {Array<UniformInternalDescription>}
     * @private
     */
    this.uniforms_ = [];
    if (options.uniforms) {
      this.setUniforms(options.uniforms);
    }

    /**
     * An array of PostProcessingPass objects is kept in this variable, built from the steps provided in the
     * options. If no post process was given, a default one is used (so as not to have to make an exception to
     * the frame buffer logic).
     * @type {Array<WebGLPostProcessingPass>}
     * @private
     */
    this.postProcessPasses_ = options.postProcesses
      ? options.postProcesses.map(
          (options) =>
            new WebGLPostProcessingPass({
              webGlContext: this.gl_,
              scaleRatio: options.scaleRatio,
              vertexShader: options.vertexShader,
              fragmentShader: options.fragmentShader,
              uniforms: options.uniforms,
            })
        )
      : [new WebGLPostProcessingPass({webGlContext: this.gl_})];

    /**
     * @type {string|null}
     * @private
     */
    this.shaderCompileErrors_ = null;

    /**
     * @type {number}
     * @private
     */
    this.startTime_ = Date.now();
  }

  /**
   * @param {Object<string, UniformValue>} uniforms Uniform definitions.
   */
  setUniforms(uniforms) {
    this.uniforms_ = [];
    this.addUniforms(uniforms);
  }

  /**
   * @param {Object<string, UniformValue>} uniforms Uniform definitions.
   */
  addUniforms(uniforms) {
    for (const name in uniforms) {
      this.uniforms_.push({
        name: name,
        value: uniforms[name],
      });
    }
  }

  /**
   * @param {string} canvasCacheKey The canvas cache key.
   * @return {boolean} The provided key matches the one this helper was constructed with.
   */
  canvasCacheKeyMatches(canvasCacheKey) {
    return this.canvasCacheKey_ === getSharedCanvasCacheKey(canvasCacheKey);
  }

  /**
   * Get a WebGL extension.  If the extension is not supported, null is returned.
   * Extensions are cached after they are enabled for the first time.
   * @param {string} name The extension name.
   * @return {Object|null} The extension or null if not supported.
   */
  getExtension(name) {
    if (name in this.extensionCache_) {
      return this.extensionCache_[name];
    }
    const extension = this.gl_.getExtension(name);
    this.extensionCache_[name] = extension;
    return extension;
  }

  /**
   * Just bind the buffer if it's in the cache. Otherwise create
   * the WebGL buffer, bind it, populate it, and add an entry to
   * the cache.
   * @param {import("./Buffer").default} buffer Buffer.
   */
  bindBuffer(buffer) {
    const gl = this.gl_;
    const bufferKey = getUid(buffer);
    let bufferCache = this.bufferCache_[bufferKey];
    if (!bufferCache) {
      const webGlBuffer = gl.createBuffer();
      bufferCache = {
        buffer: buffer,
        webGlBuffer: webGlBuffer,
      };
      this.bufferCache_[bufferKey] = bufferCache;
    }
    gl.bindBuffer(buffer.getType(), bufferCache.webGlBuffer);
  }

  /**
   * Update the data contained in the buffer array; this is required for the
   * new data to be rendered
   * @param {import("./Buffer").default} buffer Buffer.
   */
  flushBufferData(buffer) {
    const gl = this.gl_;
    this.bindBuffer(buffer);
    gl.bufferData(buffer.getType(), buffer.getArray(), buffer.getUsage());
  }

  /**
   * @param {import("./Buffer.js").default} buf Buffer.
   */
  deleteBuffer(buf) {
    const gl = this.gl_;
    const bufferKey = getUid(buf);
    const bufferCacheEntry = this.bufferCache_[bufferKey];
    if (bufferCacheEntry && !gl.isContextLost()) {
      gl.deleteBuffer(bufferCacheEntry.webGlBuffer);
    }
    delete this.bufferCache_[bufferKey];
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    const canvas = this.gl_.canvas;
    canvas.removeEventListener(
      ContextEventType.LOST,
      this.boundHandleWebGLContextLost_
    );
    canvas.removeEventListener(
      ContextEventType.RESTORED,
      this.boundHandleWebGLContextRestored_
    );

    releaseCanvas(this.canvasCacheKey_);

    delete this.gl_;
  }

  /**
   * Clear the buffer & set the viewport to draw.
   * Post process passes will be initialized here, the first one being bound as a render target for
   * subsequent draw calls.
   * @param {import("../Map.js").FrameState} frameState current frame state
   * @param {boolean} [disableAlphaBlend] If true, no alpha blending will happen.
   * @param {boolean} [enableDepth] If true, enables depth testing.
   */
  prepareDraw(frameState, disableAlphaBlend, enableDepth) {
    const gl = this.gl_;
    const canvas = this.getCanvas();
    const size = frameState.size;
    const pixelRatio = frameState.pixelRatio;

    if (
      canvas.width !== size[0] * pixelRatio ||
      canvas.height !== size[1] * pixelRatio
    ) {
      canvas.width = size[0] * pixelRatio;
      canvas.height = size[1] * pixelRatio;
      canvas.style.width = size[0] + 'px';
      canvas.style.height = size[1] + 'px';
    }

    // loop backwards in post processes list
    for (let i = this.postProcessPasses_.length - 1; i >= 0; i--) {
      this.postProcessPasses_[i].init(frameState);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.depthRange(0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, disableAlphaBlend ? gl.ZERO : gl.ONE_MINUS_SRC_ALPHA);
    if (enableDepth) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
  }

  /**
   * Prepare a program to use a texture.
   * @param {WebGLTexture} texture The texture.
   * @param {number} slot The texture slot.
   * @param {string} uniformName The corresponding uniform name.
   */
  bindTexture(texture, slot, uniformName) {
    const gl = this.gl_;
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.getUniformLocation(uniformName), slot);
  }

  /**
   * Clear the render target & bind it for future draw operations.
   * This is similar to `prepareDraw`, only post processes will not be applied.
   * Note: the whole viewport will be drawn to the render target, regardless of its size.
   * @param {import("../Map.js").FrameState} frameState current frame state
   * @param {import("./RenderTarget.js").default} renderTarget Render target to draw to
   * @param {boolean} [disableAlphaBlend] If true, no alpha blending will happen.
   * @param {boolean} [enableDepth] If true, enables depth testing.
   */
  prepareDrawToRenderTarget(
    frameState,
    renderTarget,
    disableAlphaBlend,
    enableDepth
  ) {
    const gl = this.gl_;
    const size = renderTarget.getSize();

    gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.getFramebuffer());
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderTarget.getDepthbuffer());
    gl.viewport(0, 0, size[0], size[1]);
    gl.bindTexture(gl.TEXTURE_2D, renderTarget.getTexture());
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.depthRange(0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, disableAlphaBlend ? gl.ZERO : gl.ONE_MINUS_SRC_ALPHA);
    if (enableDepth) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
  }

  /**
   * Execute a draw call based on the currently bound program, texture, buffers, attributes.
   * @param {number} start Start index.
   * @param {number} end End index.
   */
  drawElements(start, end) {
    const gl = this.gl_;
    this.getExtension('OES_element_index_uint');

    const elementType = gl.UNSIGNED_INT;
    const elementSize = 4;

    const numItems = end - start;
    const offsetInBytes = start * elementSize;
    gl.drawElements(gl.TRIANGLES, numItems, elementType, offsetInBytes);
  }

  /**
   * Apply the successive post process passes which will eventually render to the actual canvas.
   * @param {import("../Map.js").FrameState} frameState current frame state
   * @param {function(WebGLRenderingContext, import("../Map.js").FrameState):void} [preCompose] Called before composing.
   * @param {function(WebGLRenderingContext, import("../Map.js").FrameState):void} [postCompose] Called before composing.
   */
  finalizeDraw(frameState, preCompose, postCompose) {
    // apply post processes using the next one as target
    for (let i = 0, ii = this.postProcessPasses_.length; i < ii; i++) {
      if (i === ii - 1) {
        this.postProcessPasses_[i].apply(
          frameState,
          null,
          preCompose,
          postCompose
        );
      } else {
        this.postProcessPasses_[i].apply(
          frameState,
          this.postProcessPasses_[i + 1]
        );
      }
    }
  }

  /**
   * @return {HTMLCanvasElement} Canvas.
   */
  getCanvas() {
    return /** @type {HTMLCanvasElement} */ (this.gl_.canvas);
  }

  /**
   * Get the WebGL rendering context
   * @return {WebGLRenderingContext} The rendering context.
   */
  getGL() {
    return this.gl_;
  }

  /**
   * Sets the default matrix uniforms for a given frame state. This is called internally in `prepareDraw`.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   */
  applyFrameState(frameState) {
    const size = frameState.size;
    const rotation = frameState.viewState.rotation;
    const pixelRatio = frameState.pixelRatio;

    this.setUniformFloatValue(
      DefaultUniform.TIME,
      (Date.now() - this.startTime_) * 0.001
    );
    this.setUniformFloatValue(DefaultUniform.ZOOM, frameState.viewState.zoom);
    this.setUniformFloatValue(
      DefaultUniform.RESOLUTION,
      frameState.viewState.resolution
    );
    this.setUniformFloatValue(DefaultUniform.PIXEL_RATIO, pixelRatio);
    this.setUniformFloatVec2(DefaultUniform.VIEWPORT_SIZE_PX, [
      size[0],
      size[1],
    ]);
    this.setUniformFloatValue(DefaultUniform.ROTATION, rotation);
  }

  /**
   * Sets the `u_hitDetection` uniform.
   * @param {boolean} enabled Whether to enable the hit detection code path
   */
  applyHitDetectionUniform(enabled) {
    const loc = this.getUniformLocation(DefaultUniform.HIT_DETECTION);
    this.getGL().uniform1i(loc, enabled ? 1 : 0);

    // hit detection uses a fixed pixel ratio
    if (enabled) {
      this.setUniformFloatValue(DefaultUniform.PIXEL_RATIO, 0.5);
    }
  }

  /**
   * Sets the custom uniforms based on what was given in the constructor. This is called internally in `prepareDraw`.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   */
  applyUniforms(frameState) {
    const gl = this.gl_;

    let value;
    let textureSlot = 0;
    this.uniforms_.forEach((uniform) => {
      value =
        typeof uniform.value === 'function'
          ? uniform.value(frameState)
          : uniform.value;

      // apply value based on type
      if (
        value instanceof HTMLCanvasElement ||
        value instanceof HTMLImageElement ||
        value instanceof ImageData
      ) {
        // create a texture & put data
        if (!uniform.texture) {
          uniform.prevValue = undefined;
          uniform.texture = gl.createTexture();
        }
        this.bindTexture(uniform.texture, textureSlot, uniform.name);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const imageReady =
          !(value instanceof HTMLImageElement) ||
          /** @type {HTMLImageElement} */ (value).complete;
        if (imageReady && uniform.prevValue !== value) {
          uniform.prevValue = value;
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            value
          );
        }
        textureSlot++;
      } else if (Array.isArray(value) && value.length === 6) {
        this.setUniformMatrixValue(
          uniform.name,
          fromTransform(this.tmpMat4_, value)
        );
      } else if (Array.isArray(value) && value.length <= 4) {
        switch (value.length) {
          case 2:
            gl.uniform2f(
              this.getUniformLocation(uniform.name),
              value[0],
              value[1]
            );
            return;
          case 3:
            gl.uniform3f(
              this.getUniformLocation(uniform.name),
              value[0],
              value[1],
              value[2]
            );
            return;
          case 4:
            gl.uniform4f(
              this.getUniformLocation(uniform.name),
              value[0],
              value[1],
              value[2],
              value[3]
            );
            return;
          default:
            return;
        }
      } else if (typeof value === 'number') {
        gl.uniform1f(this.getUniformLocation(uniform.name), value);
      }
    });
  }

  /**
   * Set up a program for use. The program will be set as the current one. Then, the uniforms used
   * in the program will be set based on the current frame state and the helper configuration.
   * @param {WebGLProgram} program Program.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   */
  useProgram(program, frameState) {
    const gl = this.gl_;
    gl.useProgram(program);
    this.currentProgram_ = program;
    this.applyFrameState(frameState);
    this.applyUniforms(frameState);
  }

  /**
   * Will attempt to compile a vertex or fragment shader based on source
   * On error, the shader will be returned but
   * `gl.getShaderParameter(shader, gl.COMPILE_STATUS)` will return `true`
   * Use `gl.getShaderInfoLog(shader)` to have details
   * @param {string} source Shader source
   * @param {ShaderType} type VERTEX_SHADER or FRAGMENT_SHADER
   * @return {WebGLShader} Shader object
   */
  compileShader(source, type) {
    const gl = this.gl_;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  /**
   * Create a program for a vertex and fragment shader.  Throws if shader compilation fails.
   * @param {string} fragmentShaderSource Fragment shader source.
   * @param {string} vertexShaderSource Vertex shader source.
   * @return {WebGLProgram} Program
   */
  getProgram(fragmentShaderSource, vertexShaderSource) {
    const gl = this.gl_;

    const fragmentShader = this.compileShader(
      fragmentShaderSource,
      gl.FRAGMENT_SHADER
    );

    const vertexShader = this.compileShader(
      vertexShaderSource,
      gl.VERTEX_SHADER
    );

    const program = gl.createProgram();
    gl.attachShader(program, fragmentShader);
    gl.attachShader(program, vertexShader);
    gl.linkProgram(program);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const message = `Fragment shader compilation failed: ${gl.getShaderInfoLog(
        fragmentShader
      )}`;
      throw new Error(message);
    }
    gl.deleteShader(fragmentShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const message = `Vertex shader compilation failed: ${gl.getShaderInfoLog(
        vertexShader
      )}`;
      throw new Error(message);
    }
    gl.deleteShader(vertexShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = `GL program linking failed: ${gl.getProgramInfoLog(
        program
      )}`;
      throw new Error(message);
    }

    return program;
  }

  /**
   * Will get the location from the shader or the cache
   * @param {string} name Uniform name
   * @return {WebGLUniformLocation} uniformLocation
   */
  getUniformLocation(name) {
    const programUid = getUid(this.currentProgram_);
    if (this.uniformLocationsByProgram_[programUid] === undefined) {
      this.uniformLocationsByProgram_[programUid] = {};
    }
    if (this.uniformLocationsByProgram_[programUid][name] === undefined) {
      this.uniformLocationsByProgram_[programUid][name] =
        this.gl_.getUniformLocation(this.currentProgram_, name);
    }
    return this.uniformLocationsByProgram_[programUid][name];
  }

  /**
   * Will get the location from the shader or the cache
   * @param {string} name Attribute name
   * @return {number} attribLocation
   */
  getAttributeLocation(name) {
    const programUid = getUid(this.currentProgram_);
    if (this.attribLocationsByProgram_[programUid] === undefined) {
      this.attribLocationsByProgram_[programUid] = {};
    }
    if (this.attribLocationsByProgram_[programUid][name] === undefined) {
      this.attribLocationsByProgram_[programUid][name] =
        this.gl_.getAttribLocation(this.currentProgram_, name);
    }
    return this.attribLocationsByProgram_[programUid][name];
  }

  /**
   * Sets the given transform to apply the rotation/translation/scaling of the given frame state.
   * The resulting transform can be used to convert world space coordinates to view coordinates in the [-1, 1] range.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @param {import("../transform").Transform} transform Transform to update.
   * @return {import("../transform").Transform} The updated transform object.
   */
  makeProjectionTransform(frameState, transform) {
    const size = frameState.size;
    const rotation = frameState.viewState.rotation;
    const resolution = frameState.viewState.resolution;
    const center = frameState.viewState.center;
    composeTransform(
      transform,
      0,
      0,
      2 / (resolution * size[0]),
      2 / (resolution * size[1]),
      -rotation,
      -center[0],
      -center[1]
    );
    return transform;
  }

  /**
   * Give a value for a standard float uniform
   * @param {string} uniform Uniform name
   * @param {number} value Value
   */
  setUniformFloatValue(uniform, value) {
    this.gl_.uniform1f(this.getUniformLocation(uniform), value);
  }

  /**
   * Give a value for a vec2 uniform
   * @param {string} uniform Uniform name
   * @param {Array<number>} value Array of length 4.
   */
  setUniformFloatVec2(uniform, value) {
    this.gl_.uniform2fv(this.getUniformLocation(uniform), value);
  }

  /**
   * Give a value for a vec4 uniform
   * @param {string} uniform Uniform name
   * @param {Array<number>} value Array of length 4.
   */
  setUniformFloatVec4(uniform, value) {
    this.gl_.uniform4fv(this.getUniformLocation(uniform), value);
  }

  /**
   * Give a value for a standard matrix4 uniform
   * @param {string} uniform Uniform name
   * @param {Array<number>} value Matrix value
   */
  setUniformMatrixValue(uniform, value) {
    this.gl_.uniformMatrix4fv(this.getUniformLocation(uniform), false, value);
  }

  /**
   * Will set the currently bound buffer to an attribute of the shader program. Used by `#enableAttributes`
   * internally.
   * @param {string} attribName Attribute name
   * @param {number} size Number of components per attributes
   * @param {number} type UNSIGNED_INT, UNSIGNED_BYTE, UNSIGNED_SHORT or FLOAT
   * @param {number} stride Stride in bytes (0 means attribs are packed)
   * @param {number} offset Offset in bytes
   * @private
   */
  enableAttributeArray_(attribName, size, type, stride, offset) {
    const location = this.getAttributeLocation(attribName);
    // the attribute has not been found in the shaders or is not used; do not enable it
    if (location < 0) {
      return;
    }
    this.gl_.enableVertexAttribArray(location);
    this.gl_.vertexAttribPointer(location, size, type, false, stride, offset);
  }

  /**
   * Will enable the following attributes to be read from the currently bound buffer,
   * i.e. tell the GPU where to read the different attributes in the buffer. An error in the
   * size/type/order of attributes will most likely break the rendering and throw a WebGL exception.
   * @param {Array<AttributeDescription>} attributes Ordered list of attributes to read from the buffer
   */
  enableAttributes(attributes) {
    const stride = computeAttributesStride(attributes);
    let offset = 0;
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      this.enableAttributeArray_(
        attr.name,
        attr.size,
        attr.type || FLOAT,
        stride,
        offset
      );
      offset += attr.size * getByteSizeFromType(attr.type);
    }
  }

  /**
   * WebGL context was lost
   * @param {WebGLContextEvent} event The context loss event.
   * @private
   */
  handleWebGLContextLost(event) {
    clear(this.bufferCache_);
    this.currentProgram_ = null;

    event.preventDefault();
  }

  /**
   * WebGL context was restored
   * @private
   */
  handleWebGLContextRestored() {
    this.needsToBeRecreated_ = true;
  }

  /**
   * Returns whether this helper needs to be recreated, as the context was lost and then restored.
   * @return {boolean} Whether this helper needs to be recreated.
   */
  needsToBeRecreated() {
    return this.needsToBeRecreated_;
  }

  /**
   * Will create or reuse a given webgl texture and apply the given size. If no image data
   * specified, the texture will be empty, otherwise image data will be used and the `size`
   * parameter will be ignored.
   * Note: wrap parameters are set to clamp to edge, min filter is set to linear.
   * @param {Array<number>} size Expected size of the texture
   * @param {ImageData|HTMLImageElement|HTMLCanvasElement} [data] Image data/object to bind to the texture
   * @param {WebGLTexture} [texture] Existing texture to reuse
   * @return {WebGLTexture} The generated texture
   */
  createTexture(size, data, texture) {
    const gl = this.gl_;
    texture = texture || gl.createTexture();

    // set params & size
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (data) {
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, format, type, data);
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        size[0],
        size[1],
        border,
        format,
        type,
        null
      );
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }
}
