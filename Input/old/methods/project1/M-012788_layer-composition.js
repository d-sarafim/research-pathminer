propagateRenderTarget(startIndex, fromCamera) {

    for (let a = startIndex; a >= 0; a--) {

        const ra = this._renderActions[a];
        const layer = this.layerList[ra.layerIndex];

        // if we hit render action with a render target (other than depth layer), that marks the end of camera stack
        // TODO: refactor this as part of depth layer refactoring
        if (ra.renderTarget && layer.id !== LAYERID_DEPTH) {
            break;
        }

        // skip over depth layer
        if (layer.id === LAYERID_DEPTH) {
            continue;
        }

        // camera stack ends when viewport or scissor of the camera changes
        const thisCamera = ra?.camera.camera;
        if (thisCamera) {
            if (!fromCamera.camera.rect.equals(thisCamera.rect) || !fromCamera.camera.scissorRect.equals(thisCamera.scissorRect)) {
                break;
            }
        }

        // render it to render target
        ra.renderTarget = fromCamera.renderTarget;
    }
}
