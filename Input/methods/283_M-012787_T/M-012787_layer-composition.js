addRenderAction(renderActions, renderActionIndex, layer, layerIndex, cameraIndex, cameraFirstRenderAction, postProcessMarked) {

    // try and reuse object, otherwise allocate new
    /** @type {RenderAction} */
    let renderAction = renderActions[renderActionIndex];
    if (!renderAction) {
        renderAction = renderActions[renderActionIndex] = new RenderAction();
    }

    // render target from the camera takes precedence over the render target from the layer
    let rt = layer.renderTarget;
    /** @type {import('../../framework/components/camera/component.js').CameraComponent} */
    const camera = layer.cameras[cameraIndex];
    if (camera && camera.renderTarget) {
        if (layer.id !== LAYERID_DEPTH) {   // ignore depth layer
            rt = camera.renderTarget;
        }
    }

    // was camera and render target combo used already
    let used = false;
    for (let i = renderActionIndex - 1; i >= 0; i--) {
        if (renderActions[i].camera === camera && renderActions[i].renderTarget === rt) {
            used = true;
            break;
        }
    }

    // clear flags - use camera clear flags in the first render action for each camera,
    // or when render target (from layer) was not yet cleared by this camera
    const needsClear = cameraFirstRenderAction || !used;
    let clearColor = needsClear ? camera.clearColorBuffer : false;
    let clearDepth = needsClear ? camera.clearDepthBuffer : false;
    let clearStencil = needsClear ? camera.clearStencilBuffer : false;

    // clear buffers if requested by the layer
    clearColor ||= layer.clearColorBuffer;
    clearDepth ||= layer.clearDepthBuffer;
    clearStencil ||= layer.clearStencilBuffer;

    // for cameras with post processing enabled, on layers after post processing has been applied already (so UI and similar),
    // don't render them to render target anymore
    if (postProcessMarked && camera.postEffectsEnabled) {
        rt = null;
    }

    // store the properties - write all as we reuse previously allocated class instances
    renderAction.triggerPostprocess = false;
    renderAction.layerIndex = layerIndex;
    renderAction.layer = layer;
    renderAction.cameraIndex = cameraIndex;
    renderAction.camera = camera;
    renderAction.renderTarget = rt;
    renderAction.clearColor = clearColor;
    renderAction.clearDepth = clearDepth;
    renderAction.clearStencil = clearStencil;
    renderAction.firstCameraUse = cameraFirstRenderAction;
    renderAction.lastCameraUse = false;

    return renderAction;
}
