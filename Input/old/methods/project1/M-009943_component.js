_enableDepthLayer(value) {
    const hasDepthLayer = this.layers.find(layerId => layerId === LAYERID_DEPTH);
    if (hasDepthLayer) {

        /** @type {import('../../../scene/layer.js').Layer} */
        const depthLayer = this.system.app.scene.layers.getLayerById(LAYERID_DEPTH);

        if (value) {
            depthLayer?.incrementCounter();
        } else {
            depthLayer?.decrementCounter();
        }
    } else if (value) {
        return false;
    }

    return true;
}
