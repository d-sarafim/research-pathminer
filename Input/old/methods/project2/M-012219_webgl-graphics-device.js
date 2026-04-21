constructor(canvas, options = {}) {
    super(canvas, options);
    options = this.initOptions;

    this.defaultFramebuffer = null;

    this.updateClientRect();

    // Add handlers for when the WebGL context is lost or restored
    this.contextLost = false;

    this._contextLostHandler = (event) => {
        event.preventDefault();
        this.contextLost = true;
        this.loseContext();
        Debug.log('pc.GraphicsDevice: WebGL context lost.');
        this.fire('devicelost');
    };

    this._contextRestoredHandler = () => {
        Debug.log('pc.GraphicsDevice: WebGL context restored.');
        this.restoreContext();
        this.contextLost = false;
        this.fire('devicerestored');
    };

    // #4136 - turn off antialiasing on AppleWebKit browsers 15.4
    const ua = (typeof navigator !== 'undefined') && navigator.userAgent;
    this.forceDisableMultisampling = ua && ua.includes('AppleWebKit') && (ua.includes('15.4') || ua.includes('15_4'));
    if (this.forceDisableMultisampling) {
        options.antialias = false;
        Debug.log("Antialiasing has been turned off due to rendering issues on AppleWebKit 15.4");
    }

    let gl = null;

    // Retrieve the WebGL context
    if (options.gl) {
        gl = options.gl;
    } else {
        const preferWebGl2 = (options.preferWebGl2 !== undefined) ? options.preferWebGl2 : true;
        const names = preferWebGl2 ? ["webgl2", "webgl", "experimental-webgl"] : ["webgl", "experimental-webgl"];
        for (let i = 0; i < names.length; i++) {
            gl = canvas.getContext(names[i], options);
            if (gl) {
                break;
            }
        }
    }

    if (!gl) {
        throw new Error("WebGL not supported");
    }

    this.gl = gl;
    this.webgl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    this._deviceType = this.webgl2 ? DEVICETYPE_WEBGL2 : DEVICETYPE_WEBGL1;

    // pixel format of the framebuffer
    const alphaBits = gl.getParameter(gl.ALPHA_BITS);
    this.framebufferFormat = alphaBits ? PIXELFORMAT_RGBA8 : PIXELFORMAT_RGB8;

    const isChrome = platform.browserName === 'chrome';
    const isSafari = platform.browserName === 'safari';
    const isMac = platform.browser && navigator.appVersion.indexOf("Mac") !== -1;

    // enable temporary texture unit workaround on desktop safari
    this._tempEnableSafariTextureUnitWorkaround = isSafari;

    // enable temporary workaround for glBlitFramebuffer failing on Mac Chrome (#2504)
    this._tempMacChromeBlitFramebufferWorkaround = isMac && isChrome && !options.alpha;

    // init polyfill for VAOs under webgl1
    if (!this.webgl2) {
        setupVertexArrayObject(gl);
    }

    canvas.addEventListener("webglcontextlost", this._contextLostHandler, false);
    canvas.addEventListener("webglcontextrestored", this._contextRestoredHandler, false);

    this.initializeExtensions();
    this.initializeCapabilities();
    this.initializeRenderState();
    this.initializeContextCaches();

    // only enable ImageBitmap on chrome
    this.supportsImageBitmap = !isSafari && typeof ImageBitmap !== 'undefined';

    this.glAddress = [
        gl.REPEAT,
        gl.CLAMP_TO_EDGE,
        gl.MIRRORED_REPEAT
    ];

    this.glBlendEquation = [
        gl.FUNC_ADD,
        gl.FUNC_SUBTRACT,
        gl.FUNC_REVERSE_SUBTRACT,
        this.webgl2 ? gl.MIN : this.extBlendMinmax ? this.extBlendMinmax.MIN_EXT : gl.FUNC_ADD,
        this.webgl2 ? gl.MAX : this.extBlendMinmax ? this.extBlendMinmax.MAX_EXT : gl.FUNC_ADD
    ];

    this.glBlendFunctionColor = [
        gl.ZERO,
        gl.ONE,
        gl.SRC_COLOR,
        gl.ONE_MINUS_SRC_COLOR,
        gl.DST_COLOR,
        gl.ONE_MINUS_DST_COLOR,
        gl.SRC_ALPHA,
        gl.SRC_ALPHA_SATURATE,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.DST_ALPHA,
        gl.ONE_MINUS_DST_ALPHA,
        gl.CONSTANT_COLOR,
        gl.ONE_MINUS_CONSTANT_COLOR
    ];

    this.glBlendFunctionAlpha = [
        gl.ZERO,
        gl.ONE,
        gl.SRC_COLOR,
        gl.ONE_MINUS_SRC_COLOR,
        gl.DST_COLOR,
        gl.ONE_MINUS_DST_COLOR,
        gl.SRC_ALPHA,
        gl.SRC_ALPHA_SATURATE,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.DST_ALPHA,
        gl.ONE_MINUS_DST_ALPHA,
        gl.CONSTANT_ALPHA,
        gl.ONE_MINUS_CONSTANT_ALPHA
    ];

    this.glComparison = [
        gl.NEVER,
        gl.LESS,
        gl.EQUAL,
        gl.LEQUAL,
        gl.GREATER,
        gl.NOTEQUAL,
        gl.GEQUAL,
        gl.ALWAYS
    ];

    this.glStencilOp = [
        gl.KEEP,
        gl.ZERO,
        gl.REPLACE,
        gl.INCR,
        gl.INCR_WRAP,
        gl.DECR,
        gl.DECR_WRAP,
        gl.INVERT
    ];

    this.glClearFlag = [
        0,
        gl.COLOR_BUFFER_BIT,
        gl.DEPTH_BUFFER_BIT,
        gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT,
        gl.STENCIL_BUFFER_BIT,
        gl.STENCIL_BUFFER_BIT | gl.COLOR_BUFFER_BIT,
        gl.STENCIL_BUFFER_BIT | gl.DEPTH_BUFFER_BIT,
        gl.STENCIL_BUFFER_BIT | gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT
    ];

    this.glCull = [
        0,
        gl.BACK,
        gl.FRONT,
        gl.FRONT_AND_BACK
    ];

    this.glFilter = [
        gl.NEAREST,
        gl.LINEAR,
        gl.NEAREST_MIPMAP_NEAREST,
        gl.NEAREST_MIPMAP_LINEAR,
        gl.LINEAR_MIPMAP_NEAREST,
        gl.LINEAR_MIPMAP_LINEAR
    ];

    this.glPrimitive = [
        gl.POINTS,
        gl.LINES,
        gl.LINE_LOOP,
        gl.LINE_STRIP,
        gl.TRIANGLES,
        gl.TRIANGLE_STRIP,
        gl.TRIANGLE_FAN
    ];

    this.glType = [
        gl.BYTE,
        gl.UNSIGNED_BYTE,
        gl.SHORT,
        gl.UNSIGNED_SHORT,
        gl.INT,
        gl.UNSIGNED_INT,
        gl.FLOAT
    ];

    this.pcUniformType = {};
    this.pcUniformType[gl.BOOL]         = UNIFORMTYPE_BOOL;
    this.pcUniformType[gl.INT]          = UNIFORMTYPE_INT;
    this.pcUniformType[gl.FLOAT]        = UNIFORMTYPE_FLOAT;
    this.pcUniformType[gl.FLOAT_VEC2]   = UNIFORMTYPE_VEC2;
    this.pcUniformType[gl.FLOAT_VEC3]   = UNIFORMTYPE_VEC3;
    this.pcUniformType[gl.FLOAT_VEC4]   = UNIFORMTYPE_VEC4;
    this.pcUniformType[gl.INT_VEC2]     = UNIFORMTYPE_IVEC2;
    this.pcUniformType[gl.INT_VEC3]     = UNIFORMTYPE_IVEC3;
    this.pcUniformType[gl.INT_VEC4]     = UNIFORMTYPE_IVEC4;
    this.pcUniformType[gl.BOOL_VEC2]    = UNIFORMTYPE_BVEC2;
    this.pcUniformType[gl.BOOL_VEC3]    = UNIFORMTYPE_BVEC3;
    this.pcUniformType[gl.BOOL_VEC4]    = UNIFORMTYPE_BVEC4;
    this.pcUniformType[gl.FLOAT_MAT2]   = UNIFORMTYPE_MAT2;
    this.pcUniformType[gl.FLOAT_MAT3]   = UNIFORMTYPE_MAT3;
    this.pcUniformType[gl.FLOAT_MAT4]   = UNIFORMTYPE_MAT4;
    this.pcUniformType[gl.SAMPLER_2D]   = UNIFORMTYPE_TEXTURE2D;
    this.pcUniformType[gl.SAMPLER_CUBE] = UNIFORMTYPE_TEXTURECUBE;
    if (this.webgl2) {
        this.pcUniformType[gl.SAMPLER_2D_SHADOW]   = UNIFORMTYPE_TEXTURE2D_SHADOW;
        this.pcUniformType[gl.SAMPLER_CUBE_SHADOW] = UNIFORMTYPE_TEXTURECUBE_SHADOW;
        this.pcUniformType[gl.SAMPLER_3D]          = UNIFORMTYPE_TEXTURE3D;
    }

    this.targetToSlot = {};
    this.targetToSlot[gl.TEXTURE_2D] = 0;
    this.targetToSlot[gl.TEXTURE_CUBE_MAP] = 1;
    this.targetToSlot[gl.TEXTURE_3D] = 2;

    // Define the uniform commit functions
    let scopeX, scopeY, scopeZ, scopeW;
    let uniformValue;
    this.commitFunction = [];
    this.commitFunction[UNIFORMTYPE_BOOL] = function (uniform, value) {
        if (uniform.value !== value) {
            gl.uniform1i(uniform.locationId, value);
            uniform.value = value;
        }
    };
    this.commitFunction[UNIFORMTYPE_INT] = this.commitFunction[UNIFORMTYPE_BOOL];
    this.commitFunction[UNIFORMTYPE_FLOAT] = function (uniform, value) {
        if (uniform.value !== value) {
            gl.uniform1f(uniform.locationId, value);
            uniform.value = value;
        }
    };
    this.commitFunction[UNIFORMTYPE_VEC2]  = function (uniform, value) {
        uniformValue = uniform.value;
        scopeX = value[0];
        scopeY = value[1];
        if (uniformValue[0] !== scopeX || uniformValue[1] !== scopeY) {
            gl.uniform2fv(uniform.locationId, value);
            uniformValue[0] = scopeX;
            uniformValue[1] = scopeY;
        }
    };
    this.commitFunction[UNIFORMTYPE_VEC3]  = function (uniform, value) {
        uniformValue = uniform.value;
        scopeX = value[0];
        scopeY = value[1];
        scopeZ = value[2];
        if (uniformValue[0] !== scopeX || uniformValue[1] !== scopeY || uniformValue[2] !== scopeZ) {
            gl.uniform3fv(uniform.locationId, value);
            uniformValue[0] = scopeX;
            uniformValue[1] = scopeY;
            uniformValue[2] = scopeZ;
        }
    };
    this.commitFunction[UNIFORMTYPE_VEC4]  = function (uniform, value) {
        uniformValue = uniform.value;
        scopeX = value[0];
        scopeY = value[1];
        scopeZ = value[2];
        scopeW = value[3];
        if (uniformValue[0] !== scopeX || uniformValue[1] !== scopeY || uniformValue[2] !== scopeZ || uniformValue[3] !== scopeW) {
            gl.uniform4fv(uniform.locationId, value);
            uniformValue[0] = scopeX;
            uniformValue[1] = scopeY;
            uniformValue[2] = scopeZ;
            uniformValue[3] = scopeW;
        }
    };
    this.commitFunction[UNIFORMTYPE_IVEC2] = function (uniform, value) {
        uniformValue = uniform.value;
        scopeX = value[0];
        scopeY = value[1];
        if (uniformValue[0] !== scopeX || uniformValue[1] !== scopeY) {
            gl.uniform2iv(uniform.locationId, value);
            uniformValue[0] = scopeX;
            uniformValue[1] = scopeY;
        }
    };
    this.commitFunction[UNIFORMTYPE_BVEC2] = this.commitFunction[UNIFORMTYPE_IVEC2];
    this.commitFunction[UNIFORMTYPE_IVEC3] = function (uniform, value) {
        uniformValue = uniform.value;
        scopeX = value[0];
        scopeY = value[1];
        scopeZ = value[2];
        if (uniformValue[0] !== scopeX || uniformValue[1] !== scopeY || uniformValue[2] !== scopeZ) {
            gl.uniform3iv(uniform.locationId, value);
            uniformValue[0] = scopeX;
            uniformValue[1] = scopeY;
            uniformValue[2] = scopeZ;
        }
    };
    this.commitFunction[UNIFORMTYPE_BVEC3] = this.commitFunction[UNIFORMTYPE_IVEC3];
    this.commitFunction[UNIFORMTYPE_IVEC4] = function (uniform, value) {
        uniformValue = uniform.value;
        scopeX = value[0];
        scopeY = value[1];
        scopeZ = value[2];
        scopeW = value[3];
        if (uniformValue[0] !== scopeX || uniformValue[1] !== scopeY || uniformValue[2] !== scopeZ || uniformValue[3] !== scopeW) {
            gl.uniform4iv(uniform.locationId, value);
            uniformValue[0] = scopeX;
            uniformValue[1] = scopeY;
            uniformValue[2] = scopeZ;
            uniformValue[3] = scopeW;
        }
    };
    this.commitFunction[UNIFORMTYPE_BVEC4] = this.commitFunction[UNIFORMTYPE_IVEC4];
    this.commitFunction[UNIFORMTYPE_MAT2]  = function (uniform, value) {
        gl.uniformMatrix2fv(uniform.locationId, false, value);
    };
    this.commitFunction[UNIFORMTYPE_MAT3]  = function (uniform, value) {
        gl.uniformMatrix3fv(uniform.locationId, false, value);
    };
    this.commitFunction[UNIFORMTYPE_MAT4]  = function (uniform, value) {
        gl.uniformMatrix4fv(uniform.locationId, false, value);
    };
    this.commitFunction[UNIFORMTYPE_FLOATARRAY] = function (uniform, value) {
        gl.uniform1fv(uniform.locationId, value);
    };
    this.commitFunction[UNIFORMTYPE_VEC2ARRAY]  = function (uniform, value) {
        gl.uniform2fv(uniform.locationId, value);
    };
    this.commitFunction[UNIFORMTYPE_VEC3ARRAY]  = function (uniform, value) {
        gl.uniform3fv(uniform.locationId, value);
    };
    this.commitFunction[UNIFORMTYPE_VEC4ARRAY]  = function (uniform, value) {
        gl.uniform4fv(uniform.locationId, value);
    };

    this.supportsBoneTextures = this.extTextureFloat && this.maxVertexTextures > 0;

    // Calculate an estimate of the maximum number of bones that can be uploaded to the GPU
    // based on the number of available uniforms and the number of uniforms required for non-
    // bone data.  This is based off of the Standard shader.  A user defined shader may have
    // even less space available for bones so this calculated value can be overridden via
    // pc.GraphicsDevice.setBoneLimit.
    let numUniforms = this.vertexUniformsCount;
    numUniforms -= 4 * 4; // Model, view, projection and shadow matrices
    numUniforms -= 8;     // 8 lights max, each specifying a position vector
    numUniforms -= 1;     // Eye position
    numUniforms -= 4 * 4; // Up to 4 texture transforms
    this.boneLimit = Math.floor(numUniforms / 3);   // each bone uses 3 uniforms

    // Put a limit on the number of supported bones before skin partitioning must be performed
    // Some GPUs have demonstrated performance issues if the number of vectors allocated to the
    // skin matrix palette is left unbounded
    this.boneLimit = Math.min(this.boneLimit, 128);

    if (this.unmaskedRenderer === 'Mali-450 MP') {
        this.boneLimit = 34;
    }

    this.constantTexSource = this.scope.resolve("source");

    if (this.extTextureFloat) {
        if (this.webgl2) {
            // In WebGL2 float texture renderability is dictated by the EXT_color_buffer_float extension
            this.textureFloatRenderable = !!this.extColorBufferFloat;
        } else {
            // In WebGL1 we should just try rendering into a float texture
            this.textureFloatRenderable = testRenderable(gl, gl.FLOAT);
        }
    } else {
        this.textureFloatRenderable = false;
    }

    // two extensions allow us to render to half float buffers
    if (this.extColorBufferHalfFloat) {
        this.textureHalfFloatRenderable = !!this.extColorBufferHalfFloat;
    } else if (this.extTextureHalfFloat) {
        if (this.webgl2) {
            // EXT_color_buffer_float should affect both float and halffloat formats
            this.textureHalfFloatRenderable = !!this.extColorBufferFloat;
        } else {
            // Manual render check for half float
            this.textureHalfFloatRenderable = testRenderable(gl, this.extTextureHalfFloat.HALF_FLOAT_OES);
        }
    } else {
        this.textureHalfFloatRenderable = false;
    }

    this.supportsMorphTargetTexturesCore = (this.maxPrecision === "highp" && this.maxVertexTextures >= 2);
    this.supportsDepthShadow = this.webgl2;

    this._textureFloatHighPrecision = undefined;
    this._textureHalfFloatUpdatable = undefined;

    // area light LUT format - order of preference: half, float, 8bit
    this.areaLightLutFormat = PIXELFORMAT_RGBA8;
    if (this.extTextureHalfFloat && this.textureHalfFloatUpdatable && this.extTextureHalfFloatLinear) {
        this.areaLightLutFormat = PIXELFORMAT_RGBA16F;
    } else if (this.extTextureFloat && this.extTextureFloatLinear) {
        this.areaLightLutFormat = PIXELFORMAT_RGBA32F;
    }

    this.postInit();
}
