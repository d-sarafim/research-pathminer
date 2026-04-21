drawLayers(layers, framestamp) {
    const map = this.map,
        isInteracting = map.isInteracting(),
        // all the visible canvas layers' ids.
        canvasIds = [],
        // all the updated canvas layers's ids.
        updatedIds = [],
        fps = map.options['fpsOnInteracting'] || 0,
        timeLimit = fps === 0 ? 0 : 1000 / fps,
        // time of layer drawing
        layerLimit = this.map.options['layerCanvasLimitOnInteracting'],
        l = layers.length;
    const baseLayer = map.getBaseLayer();
    let t = 0;
    for (let i = 0; i < l; i++) {
        const layer = layers[i];
        if (!layer.isVisible()) {
            continue;
        }
        const isCanvas = layer.isCanvasRender();
        if (isCanvas) {
            canvasIds.push(layer.getId());
        }
        const renderer = layer._getRenderer();
        if (!renderer) {
            continue;
        }
        // if need to call layer's draw/drawInteracting
        const needsRedraw = this._checkLayerRedraw(layer);
        if (isCanvas && renderer.isCanvasUpdated()) {
            // don't need to call layer's draw/drawOnInteracting but need to redraw layer's updated canvas
            if (!needsRedraw) {
                updatedIds.push(layer.getId());
            }
            this.setLayerCanvasUpdated();
        }
        const transformMatrix = renderer.__zoomTransformMatrix;
        delete renderer.__zoomTransformMatrix;
        if (!needsRedraw) {
            if (isCanvas && isInteracting) {
                if (map.isZooming() && !map.getPitch()) {
                    // transform layer's current canvas when zooming
                    renderer.prepareRender();
                    renderer.__zoomTransformMatrix = this._zoomMatrix;
                } else if (map.getPitch() || map.isRotating()) {
                    // when map is pitching or rotating, clear the layer canvas
                    // otherwise, leave layer's canvas unchanged
                    renderer.clearCanvas();
                }
            }
            continue;
        }

        if (isInteracting && isCanvas) {
            if (layerLimit > 0 && l - 1 - i > layerLimit && layer !== baseLayer) {
                layer._getRenderer().clearCanvas();
                continue;
            }
            t += this._drawCanvasLayerOnInteracting(layer, t, timeLimit, framestamp);
        } else if (isInteracting && renderer.drawOnInteracting) {
            // dom layers
            if (renderer.prepareRender) {
                renderer.prepareRender();
            }
            if (renderer.checkAndDraw) {
                // for canvas renderers
                renderer.checkAndDraw(renderer.drawOnInteracting, this._eventParam, framestamp);
            } else {
                renderer.drawOnInteracting(this._eventParam, framestamp);
            }
        } else {
            // map is not interacting, call layer's render
            renderer.render(framestamp);
            //地图缩放完以后，如果下一次render需要载入资源，仍需要设置transformMatrix
            //防止在资源载入完成之前，缺少transformMatrix导致的绘制错误
            if (isCanvas && transformMatrix && renderer.isLoadingResource()) {
                renderer.__zoomTransformMatrix = transformMatrix;
            }
        }

        if (isCanvas) {
            updatedIds.push(layer.getId());
            this.setLayerCanvasUpdated();
        }
    }
    // compare:
    // 1. previous drawn layers and current drawn layers
    // 2. previous canvas layers and current canvas layers
    // set map to redraw if either changed
    const preCanvasIds = this._canvasIds || [];
    const preUpdatedIds = this._updatedIds || [];
    this._canvasIds = canvasIds;
    this._updatedIds = updatedIds;
    if (!this.isLayerCanvasUpdated()) {
        const sep = '---';
        if (preCanvasIds.join(sep) !== canvasIds.join(sep) || preUpdatedIds.join(sep) !== updatedIds.join(sep)) {
            this.setLayerCanvasUpdated();
        }
    }
}
