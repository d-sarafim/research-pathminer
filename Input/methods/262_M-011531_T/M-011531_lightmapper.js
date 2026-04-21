bakeInternal(passCount, bakeNodes, allNodes) {

    const scene = this.scene;
    const comp = scene.layers;
    const device = this.device;
    const clusteredLightingEnabled = scene.clusteredLightingEnabled;

    this.createMaterials(device, scene, passCount);
    this.setupScene();

    // update layer composition
    comp._update();

    // compute bounding boxes for nodes
    this.computeNodesBounds(bakeNodes);

    // Calculate lightmap sizes and allocate textures
    this.allocateTextures(bakeNodes, passCount);

    // Collect bakeable lights, and also keep allLights along with their properties we change to restore them later
    this.renderer.collectLights(comp);
    const allLights = [], bakeLights = [];
    this.prepareLightsToBake(comp, allLights, bakeLights);

    // update transforms
    this.updateTransforms(allNodes);

    // get all meshInstances that cast shadows into lightmap and set them up for realtime shadow casting
    const casters = this.prepareShadowCasters(allNodes);

    // update skinned and morphed meshes
    this.renderer.updateCpuSkinMatrices(casters);
    this.renderer.gpuUpdate(casters);

    // compound bounding box for all casters, used to compute shared directional light shadow
    const casterBounds = this.computeBounds(casters);

    let i, j, rcv, m;

    // Prepare models
    for (i = 0; i < bakeNodes.length; i++) {
        const bakeNode = bakeNodes[i];
        rcv = bakeNode.meshInstances;

        for (j = 0; j < rcv.length; j++) {
            // patch meshInstance
            m = rcv[j];

            m.setLightmapped(false);
            m.mask = MASK_BAKE; // only affected by LM lights

            // patch material
            m.setRealtimeLightmap(MeshInstance.lightmapParamNames[0], m.material.lightMap ? m.material.lightMap : this.blackTex);
            m.setRealtimeLightmap(MeshInstance.lightmapParamNames[1], this.blackTex);
        }
    }

    // Disable all bakeable lights
    for (j = 0; j < bakeLights.length; j++) {
        bakeLights[j].light.enabled = false;
    }

    const lightArray = [[], [], []];
    let pass, node;
    let shadersUpdatedOn1stPass = false;

    // Accumulate lights into RGBM textures
    for (i = 0; i < bakeLights.length; i++) {
        const bakeLight = bakeLights[i];
        const isAmbientLight = bakeLight instanceof BakeLightAmbient;
        const isDirectional = bakeLight.light.type === LIGHTTYPE_DIRECTIONAL;

        // light can be baked using many virtual lights to create soft effect
        let numVirtualLights = bakeLight.numVirtualLights;

        // direction baking is not currently compatible with virtual lights, as we end up with no valid direction in lights penumbra
        if (passCount > 1 && numVirtualLights > 1 && bakeLight.light.bakeDir) {
            numVirtualLights = 1;
            Debug.warn('Lightmapper\'s BAKE_COLORDIR mode is not compatible with Light\'s bakeNumSamples larger than one. Forcing it to one.');
        }

        for (let virtualLightIndex = 0; virtualLightIndex < numVirtualLights; virtualLightIndex++) {

            DebugGraphics.pushGpuMarker(device, `Light:${bakeLight.light._node.name}:${virtualLightIndex}`);

            // prepare virtual light
            if (numVirtualLights > 1) {
                bakeLight.prepareVirtualLight(virtualLightIndex, numVirtualLights);
            }

            bakeLight.startBake();
            let shadowMapRendered = false;

            const shadowCam = this.lightCameraPrepare(device, bakeLight);

            for (node = 0; node < bakeNodes.length; node++) {

                const bakeNode = bakeNodes[node];
                rcv = bakeNode.meshInstances;

                const lightAffectsNode = this.lightCameraPrepareAndCull(bakeLight, bakeNode, shadowCam, casterBounds);
                if (!lightAffectsNode) {
                    continue;
                }

                this.setupLightArray(lightArray, bakeLight.light);
                const clusterLights = isDirectional ? [] : [bakeLight.light];

                if (clusteredLightingEnabled) {
                    this.renderer.lightTextureAtlas.update(clusterLights, this.lightingParams);
                }

                // render light shadow map needs to be rendered
                shadowMapRendered = this.renderShadowMap(comp, shadowMapRendered, casters, bakeLight);

                if (clusteredLightingEnabled) {
                    this.worldClusters.update(clusterLights, this.scene.gammaCorrection, this.lightingParams);
                }

                // Store original materials
                this.backupMaterials(rcv);

                for (pass = 0; pass < passCount; pass++) {

                    // only bake first virtual light for pass 1, as it does not handle overlapping lights
                    if (pass > 0 && virtualLightIndex > 0) {
                        break;
                    }

                    // don't bake ambient light in pass 1, as there's no main direction
                    if (isAmbientLight && pass > 0) {
                        break;
                    }

                    DebugGraphics.pushGpuMarker(device, `LMPass:${pass}`);

                    // lightmap size
                    const nodeRT = bakeNode.renderTargets[pass];
                    const lightmapSize = bakeNode.renderTargets[pass].colorBuffer.width;

                    // get matching temp render target to render to
                    const tempRT = this.renderTargets.get(lightmapSize);
                    const tempTex = tempRT.colorBuffer;

                    if (pass === 0) {
                        shadersUpdatedOn1stPass = scene.updateShaders;
                    } else if (shadersUpdatedOn1stPass) {
                        scene.updateShaders = true;
                    }

                    let passMaterial = this.passMaterials[pass];
                    if (isAmbientLight) {
                        // for last virtual light of ambient light, multiply accumulated AO lightmap with ambient light
                        const lastVirtualLightForPass = virtualLightIndex + 1 === numVirtualLights;
                        if (lastVirtualLightForPass && pass === 0) {
                            passMaterial = this.ambientAOMaterial;
                        }
                    }

                    // set up material for baking a pass
                    for (j = 0; j < rcv.length; j++) {
                        rcv[j].material = passMaterial;
                    }

                    // update shader
                    this.renderer.updateShaders(rcv);

                    // ping-ponging output
                    this.renderer.setCamera(this.camera, tempRT, true);

                    if (pass === PASS_DIR) {
                        this.constantBakeDir.setValue(bakeLight.light.bakeDir ? 1 : 0);
                    }

                    // prepare clustered lighting
                    if (clusteredLightingEnabled) {
                        this.worldClusters.activate();
                    }

                    this.renderer._forwardTime = 0;
                    this.renderer._shadowMapTime = 0;

                    this.renderer.renderForward(this.camera, rcv, lightArray, SHADER_FORWARDHDR);

                    device.updateEnd();

                    // #if _PROFILER
                    this.stats.shadowMapTime += this.renderer._shadowMapTime;
                    this.stats.forwardTime += this.renderer._forwardTime;
                    this.stats.renderPasses++;
                    // #endif

                    // temp render target now has lightmap, store it for the node
                    bakeNode.renderTargets[pass] = tempRT;

                    // and release previous lightmap into temp render target pool
                    this.renderTargets.set(lightmapSize, nodeRT);

                    for (j = 0; j < rcv.length; j++) {
                        m = rcv[j];
                        m.setRealtimeLightmap(MeshInstance.lightmapParamNames[pass], tempTex); // ping-ponging input
                        m._shaderDefs |= SHADERDEF_LM; // force using LM even if material doesn't have it
                    }

                    DebugGraphics.popGpuMarker(device);
                }

                // Revert to original materials
                this.restoreMaterials(rcv);
            }

            bakeLight.endBake(this.shadowMapCache);

            DebugGraphics.popGpuMarker(device);
        }
    }

    this.postprocessTextures(device, bakeNodes, passCount);

    // restore changes
    for (node = 0; node < allNodes.length; node++) {
        allNodes[node].restore();
    }

    this.restoreLights(allLights);
    this.restoreScene();

    // empty cache to minimize persistent memory use .. if some cached textures are needed,
    // they will be allocated again as needed
    if (!clusteredLightingEnabled) {
        this.shadowMapCache.clear();
    }
}
