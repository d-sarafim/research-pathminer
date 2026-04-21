_destroy() {
    if (this._colorRenderer) {
        this._colorRenderer.destroy();
    }
    if (this._depthRenderer) {
        this._depthRenderer.destroy();
    }
    if (this._silhouetteRenderer) {
        this._silhouetteRenderer.destroy();
    }
    if (this._pickMeshRenderer) {
        this._pickMeshRenderer.destroy();
    }
    if (this._pickDepthRenderer) {
        this._pickDepthRenderer.destroy();
    }
    if (this._occlusionRenderer) {
        this._occlusionRenderer.destroy();
    }
    if (this._shadowRenderer) {
        this._shadowRenderer.destroy();
    }
}
