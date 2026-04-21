_allocate() {
    const scene = this._scene;
    const gl = scene.canvas.gl;
    const lightsState = scene._lightsState;

    this._program = new Program(gl, this._buildShader());

    if (this._program.errors) {
        this.errors = this._program.errors;
        return;
    }

    const program = this._program;

    this._uRenderPass = program.getLocation("renderPass");

    this._uColor = program.getLocation("color");
    if (!this._uColor) {
        // some shader may have color as attribute, in this case the uniform must be renamed silhouetteColor
        this._uColor = program.getLocation("silhouetteColor");
    }
    this._uUVDecodeMatrix = program.getLocation("uvDecodeMatrix");
    this._uPickInvisible = program.getLocation("pickInvisible");
    this._uGammaFactor = program.getLocation("gammaFactor");

    gl.uniformBlockBinding(
        program.handle,
        gl.getUniformBlockIndex(program.handle, "Matrices"),
        this._matricesUniformBlockBufferBindingPoint
    );

    this._uShadowViewMatrix = program.getLocation("shadowViewMatrix");
    this._uShadowProjMatrix = program.getLocation("shadowProjMatrix");
    if (scene.logarithmicDepthBufferEnabled) {
        this._uZFar = program.getLocation("zFar");
    }

    this._uLightAmbient = program.getLocation("lightAmbient");
    this._uLightColor = [];
    this._uLightDir = [];
    this._uLightPos = [];
    this._uLightAttenuation = [];

    // TODO add a gard to prevent light params if not affected by light ?
    const lights = lightsState.lights;
    let light;

    for (let i = 0, len = lights.length; i < len; i++) {
        light = lights[i];
        switch (light.type) {
            case "dir":
                this._uLightColor[i] = program.getLocation("lightColor" + i);
                this._uLightPos[i] = null;
                this._uLightDir[i] = program.getLocation("lightDir" + i);
                break;
            case "point":
                this._uLightColor[i] = program.getLocation("lightColor" + i);
                this._uLightPos[i] = program.getLocation("lightPos" + i);
                this._uLightDir[i] = null;
                this._uLightAttenuation[i] = program.getLocation("lightAttenuation" + i);
                break;
            case "spot":
                this._uLightColor[i] = program.getLocation("lightColor" + i);
                this._uLightPos[i] = program.getLocation("lightPos" + i);
                this._uLightDir[i] = program.getLocation("lightDir" + i);
                this._uLightAttenuation[i] = program.getLocation("lightAttenuation" + i);
                break;
        }
    }

    if (lightsState.reflectionMaps.length > 0) {
        this._uReflectionMap = "reflectionMap";
    }

    if (lightsState.lightMaps.length > 0) {
        this._uLightMap = "lightMap";
    }

    this._uSectionPlanes = [];

    for (let i = 0, len = scene._sectionPlanesState.sectionPlanes.length; i < len; i++) {
        this._uSectionPlanes.push({
            active: program.getLocation("sectionPlaneActive" + i),
            pos: program.getLocation("sectionPlanePos" + i),
            dir: program.getLocation("sectionPlaneDir" + i)
        });
    }

    this._aPosition = program.getAttribute("position");
    this._aOffset = program.getAttribute("offset");
    this._aNormal = program.getAttribute("normal");
    this._aUV = program.getAttribute("uv");
    this._aColor = program.getAttribute("color");
    this._aMetallicRoughness = program.getAttribute("metallicRoughness");
    this._aFlags = program.getAttribute("flags");
    this._aPickColor = program.getAttribute("pickColor");
    this._uPickZNear = program.getLocation("pickZNear");
    this._uPickZFar = program.getLocation("pickZFar");

    this._uColorMap = "uColorMap";
    this._uMetallicRoughMap = "uMetallicRoughMap";
    this._uEmissiveMap = "uEmissiveMap";
    this._uNormalMap = "uNormalMap";
    this._uAOMap = "uAOMap";

    if (this._instancing) {
        this._aModelMatrixCol0 = program.getAttribute("modelMatrixCol0");
        this._aModelMatrixCol1 = program.getAttribute("modelMatrixCol1");
        this._aModelMatrixCol2 = program.getAttribute("modelMatrixCol2");

        this._aModelNormalMatrixCol0 = program.getAttribute("modelNormalMatrixCol0");
        this._aModelNormalMatrixCol1 = program.getAttribute("modelNormalMatrixCol1");
        this._aModelNormalMatrixCol2 = program.getAttribute("modelNormalMatrixCol2");
    }

    if (this._withSAO) {
        this._uOcclusionTexture = "uOcclusionTexture";
        this._uSAOParams = program.getLocation("uSAOParams");
    }

    if (scene.logarithmicDepthBufferEnabled) {
        this._uLogDepthBufFC = program.getLocation("logDepthBufFC");
    }

    if (scene.pointsMaterial._state.filterIntensity) {
        this._uIntensityRange = program.getLocation("intensityRange");
    }

    this._uPointSize = program.getLocation("pointSize");
    this._uNearPlaneHeight = program.getLocation("nearPlaneHeight");
}
