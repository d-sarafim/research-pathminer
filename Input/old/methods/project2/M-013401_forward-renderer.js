buildFrameGraph(frameGraph, layerComposition) {

    const clusteredLightingEnabled = this.scene.clusteredLightingEnabled;
    frameGraph.reset();

    this.update(layerComposition);

    // clustered lighting render passes
    if (clusteredLightingEnabled) {

        // cookies
        {
            const renderPass = new RenderPass(this.device, () => {
                // render cookies for all local visible lights
                if (this.scene.lighting.cookiesEnabled) {
                    this.renderCookies(this.lights);
                }
            });
            renderPass.requiresCubemaps = false;
            DebugHelper.setName(renderPass, 'ClusteredCookies');
            frameGraph.addRenderPass(renderPass);
        }

        // local shadows - these are shared by all cameras (not entirely correctly)
        {
            const renderPass = new RenderPass(this.device);
            DebugHelper.setName(renderPass, 'ClusteredLocalShadows');
            renderPass.requiresCubemaps = false;
            frameGraph.addRenderPass(renderPass);

            // render shadows only when needed
            if (this.scene.lighting.shadowsEnabled) {
                this._shadowRendererLocal.prepareClusteredRenderPass(renderPass, this.localLights);
            }

            // update clusters all the time
            renderPass.after = () => {
                this.updateClusters(layerComposition);
            };
        }

    } else {

        // non-clustered local shadows - these are shared by all cameras (not entirely correctly)
        this._shadowRendererLocal.buildNonClusteredRenderPasses(frameGraph, this.localLights);
    }

    // main passes
    let startIndex = 0;
    let newStart = true;
    let renderTarget = null;
    const renderActions = layerComposition._renderActions;

    for (let i = startIndex; i < renderActions.length; i++) {

        const renderAction = renderActions[i];
        const layer = layerComposition.layerList[renderAction.layerIndex];
        const camera = layer.cameras[renderAction.cameraIndex];

        // skip disabled layers
        if (!renderAction.isLayerEnabled(layerComposition)) {
            continue;
        }

        const isDepthLayer = layer.id === LAYERID_DEPTH;
        const isGrabPass = isDepthLayer && (camera.renderSceneColorMap || camera.renderSceneDepthMap);

        // directional shadows get re-rendered for each camera
        if (renderAction.hasDirectionalShadowLights && camera) {
            this._shadowRendererDirectional.buildFrameGraph(frameGraph, renderAction.directionalLights, camera);
        }

        // start of block of render actions rendering to the same render target
        if (newStart) {
            newStart = false;
            startIndex = i;
            renderTarget = renderAction.renderTarget;
        }

        // find the next enabled render action
        let nextIndex = i + 1;
        while (renderActions[nextIndex] && !renderActions[nextIndex].isLayerEnabled(layerComposition)) {
            nextIndex++;
        }

        // info about the next render action
        const nextRenderAction = renderActions[nextIndex];
        const isNextLayerDepth = nextRenderAction ? layerComposition.layerList[nextRenderAction.layerIndex].id === LAYERID_DEPTH : false;
        const isNextLayerGrabPass = isNextLayerDepth && (camera.renderSceneColorMap || camera.renderSceneDepthMap);

        // end of the block using the same render target
        if (!nextRenderAction || nextRenderAction.renderTarget !== renderTarget ||
            nextRenderAction.hasDirectionalShadowLights || isNextLayerGrabPass || isGrabPass) {

            // render the render actions in the range
            this.addMainRenderPass(frameGraph, layerComposition, renderTarget, startIndex, i, isGrabPass);

            // postprocessing
            if (renderAction.triggerPostprocess && camera?.onPostprocessing) {
                const renderPass = new RenderPass(this.device, () => {
                    this.renderPassPostprocessing(renderAction, layerComposition);
                });
                renderPass.requiresCubemaps = false;
                DebugHelper.setName(renderPass, `Postprocess`);
                frameGraph.addRenderPass(renderPass);
            }

            newStart = true;
        }
    }
}
