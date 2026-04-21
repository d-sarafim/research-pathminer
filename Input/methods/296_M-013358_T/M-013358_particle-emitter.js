rebuild() {
    const gd = this.graphicsDevice;

    if (this.colorMap === null) this.colorMap = this.defaultParamTexture;

    this.spawnBounds = this.emitterShape === EMITTERSHAPE_BOX ? this.emitterExtents : this.emitterRadius;

    this.useCpu = this.useCpu || this.sort > PARTICLESORT_NONE ||  // force CPU if desirable by user or sorting is enabled
    gd.maxVertexTextures <= 1 || // force CPU if can't use enough vertex textures
    gd.fragmentUniformsCount < 64 || // force CPU if can't use many uniforms; TODO: change to more realistic value (this one is iphone's)
    gd.forceCpuParticles ||
    !gd.extTextureFloat; // no float texture extension

    this._destroyResources();

    this.pack8 = (this.pack8 || !gd.textureFloatRenderable) && !this.useCpu;

    particleTexHeight = (this.useCpu || this.pack8) ? 4 : 2;

    this.useMesh = false;
    if (this.mesh) {
        const totalVertCount = this.numParticles * this.mesh.vertexBuffer.numVertices;
        if (totalVertCount > 65535) {
            Debug.warn('WARNING: particle system can\'t render mesh particles because numParticles * numVertices is more than 65k. Reverting to quad particles.');
        } else {
            this.useMesh = true;
        }
    }

    this.numParticlesPot = math.nextPowerOfTwo(this.numParticles);
    this.rebuildGraphs();
    this.calculateLocalBounds();
    this.resetWorldBounds();

    if (this.node) {
        // this.prevPos.copy(this.node.getPosition());
        this.worldBounds.setFromTransformedAabb(
            this.localBounds, this.localSpace ? Mat4.IDENTITY : this.node.getWorldTransform());

        this.worldBoundsTrail[0].copy(this.worldBounds);
        this.worldBoundsTrail[1].copy(this.worldBounds);

        this.worldBoundsSize.copy(this.worldBounds.halfExtents).mulScalar(2);
        this.prevWorldBoundsSize.copy(this.worldBoundsSize);
        this.prevWorldBoundsCenter.copy(this.worldBounds.center);
        if (this.pack8) this.calculateBoundsMad();
    }

    // Dynamic simulation data
    this.vbToSort = new Array(this.numParticles);
    for (let iSort = 0; iSort < this.numParticles; iSort++) this.vbToSort[iSort] = [0, 0];
    this.particleDistance = new Float32Array(this.numParticles);

    this._gpuUpdater.randomize();

    this.particleTex = new Float32Array(this.numParticlesPot * particleTexHeight * particleTexChannels);
    const emitterPos = (this.node === null || this.localSpace) ? Vec3.ZERO : this.node.getPosition();
    if (this.emitterShape === EMITTERSHAPE_BOX) {
        if (this.node === null || this.localSpace) {
            spawnMatrix.setTRS(Vec3.ZERO, Quat.IDENTITY, this.spawnBounds);
        } else {
            spawnMatrix.setTRS(Vec3.ZERO, this.node.getRotation(), tmpVec3.copy(this.spawnBounds).mul(this.node.localScale));
        }
        extentsInnerRatioUniform[0] = this.emitterExtents.x !== 0 ? this.emitterExtentsInner.x / this.emitterExtents.x : 0;
        extentsInnerRatioUniform[1] = this.emitterExtents.y !== 0 ? this.emitterExtentsInner.y / this.emitterExtents.y : 0;
        extentsInnerRatioUniform[2] = this.emitterExtents.z !== 0 ? this.emitterExtentsInner.z / this.emitterExtents.z : 0;
    }
    for (let i = 0; i < this.numParticles; i++) {
        this._cpuUpdater.calcSpawnPosition(this.particleTex, spawnMatrix, extentsInnerRatioUniform, emitterPos, i);
        if (this.useCpu) this.particleTex[i * particleTexChannels + 3 + this.numParticlesPot * 2 * particleTexChannels] = 1; // hide/show
    }

    this.particleTexStart = new Float32Array(this.numParticlesPot * particleTexHeight * particleTexChannels);
    for (let i = 0; i < this.particleTexStart.length; i++) {
        this.particleTexStart[i] = this.particleTex[i];
    }

    if (!this.useCpu) {
        if (this.pack8) {
            this.particleTexIN = _createTexture(gd, this.numParticlesPot, particleTexHeight, this.particleTex, PIXELFORMAT_RGBA8, 1, false);
            this.particleTexOUT = _createTexture(gd, this.numParticlesPot, particleTexHeight, this.particleTex, PIXELFORMAT_RGBA8, 1, false);
            this.particleTexStart = _createTexture(gd, this.numParticlesPot, particleTexHeight, this.particleTexStart, PIXELFORMAT_RGBA8, 1, false);
        } else {
            this.particleTexIN = _createTexture(gd, this.numParticlesPot, particleTexHeight, this.particleTex);
            this.particleTexOUT = _createTexture(gd, this.numParticlesPot, particleTexHeight, this.particleTex);
            this.particleTexStart = _createTexture(gd, this.numParticlesPot, particleTexHeight, this.particleTexStart);
        }

        this.rtParticleTexIN = new RenderTarget({
            colorBuffer: this.particleTexIN,
            depth: false
        });
        this.rtParticleTexOUT = new RenderTarget({
            colorBuffer: this.particleTexOUT,
            depth: false
        });
        this.swapTex = false;
    }

    const shaderCodeStart = (this.localSpace ? '#define LOCAL_SPACE\n' : '') + shaderChunks.particleUpdaterInitPS +
    (this.pack8 ? (shaderChunks.particleInputRgba8PS + shaderChunks.particleOutputRgba8PS) :
        (shaderChunks.particleInputFloatPS + shaderChunks.particleOutputFloatPS)) +
    (this.emitterShape === EMITTERSHAPE_BOX ? shaderChunks.particleUpdaterAABBPS : shaderChunks.particleUpdaterSpherePS) +
    shaderChunks.particleUpdaterStartPS;
    const shaderCodeRespawn = shaderCodeStart + shaderChunks.particleUpdaterRespawnPS + shaderChunks.particleUpdaterEndPS;
    const shaderCodeNoRespawn = shaderCodeStart + shaderChunks.particleUpdaterNoRespawnPS + shaderChunks.particleUpdaterEndPS;
    const shaderCodeOnStop = shaderCodeStart + shaderChunks.particleUpdaterOnStopPS + shaderChunks.particleUpdaterEndPS;

    // Note: createShaderFromCode can return a shader from the cache (not a new shader) so we *should not* delete these shaders
    // when the particle emitter is destroyed
    const params = this.emitterShape + '' + this.pack8 + '' + this.localSpace;
    this.shaderParticleUpdateRespawn = createShaderFromCode(gd, shaderChunks.fullscreenQuadVS, shaderCodeRespawn, 'fsQuad0' + params);
    this.shaderParticleUpdateNoRespawn = createShaderFromCode(gd, shaderChunks.fullscreenQuadVS, shaderCodeNoRespawn, 'fsQuad1' + params);
    this.shaderParticleUpdateOnStop = createShaderFromCode(gd, shaderChunks.fullscreenQuadVS, shaderCodeOnStop, 'fsQuad2' + params);

    this.numParticleVerts = this.useMesh ? this.mesh.vertexBuffer.numVertices : 4;
    this.numParticleIndices = this.useMesh ? this.mesh.indexBuffer[0].numIndices : 6;
    this._allocate(this.numParticles);

    const mesh = new Mesh(gd);
    mesh.vertexBuffer = this.vertexBuffer;
    mesh.indexBuffer[0] = this.indexBuffer;
    mesh.primitive[0].type = PRIMITIVE_TRIANGLES;
    mesh.primitive[0].base = 0;
    mesh.primitive[0].count = (this.numParticles * this.numParticleIndices);
    mesh.primitive[0].indexed = true;

    this.material = new Material();
    this.material.name = this.node.name;
    this.material.cull = CULLFACE_NONE;
    this.material.alphaWrite = false;
    this.material.blendType = this.blendType;

    this.material.depthWrite = this.depthWrite;
    this.material.emitter = this;

    this.regenShader();
    this.resetMaterial();

    const wasVisible = this.meshInstance ? this.meshInstance.visible : true;
    this.meshInstance = new MeshInstance(mesh, this.material, this.node);
    this.meshInstance.pick = false;
    this.meshInstance.updateKey(); // shouldn't be here?
    this.meshInstance.cull = true;
    this.meshInstance._noDepthDrawGl1 = true;
    if (this.localSpace) {
        this.meshInstance.aabb.setFromTransformedAabb(this.worldBounds, this.node.getWorldTransform());
    } else {
        this.meshInstance.aabb.copy(this.worldBounds);
    }
    this.meshInstance._updateAabb = false;
    this.meshInstance.visible = wasVisible;

    this._initializeTextures();

    this.resetTime();

    this.addTime(0, false); // fill dynamic textures and constants with initial data
    if (this.preWarm) this.prewarm(this.lifetime);
}
