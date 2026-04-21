drawLayerCanvas(layers) {
    const map = this.map;
    if (!map) {
        return false;
    }
    if (!this.isLayerCanvasUpdated() && !this.isViewChanged() && this._needClear === false) {
        return false;
    }
    if (!this.canvas) {
        this.createCanvas();
    }

    /**
     * renderstart event, an event fired when map starts to render.
     * @event Map#renderstart
     * @type {Object}
     * @property {String} type           - renderstart
     * @property {Map} target            - the map fires event
     * @property {CanvasRenderingContext2D} context  - canvas context
     */
    map._fireEvent('renderstart', {
        'context': this.context
    });

    if (!this._updateCanvasSize()) {
        this.clearCanvas();
    }

    const interacting = map.isInteracting(),
        limit = map.options['layerCanvasLimitOnInteracting'];
    let len = layers.length;

    let baseLayerImage;
    const images = [];
    for (let i = 0; i < len; i++) {
        if (!layers[i].isVisible() || !layers[i].isCanvasRender()) {
            continue;
        }
        const renderer = layers[i]._getRenderer();
        if (!renderer) {
            continue;
        }
        const layerImage = this._getLayerImage(layers[i]);
        if (layerImage && layerImage['image']) {
            if (layers[i] === map.getBaseLayer()) {
                baseLayerImage = [layers[i], layerImage];
            } else {
                images.push([layers[i], layerImage]);
            }
        }
    }

    const targetWidth = this.canvas.width;
    const targetHeight = this.canvas.height;
    if (baseLayerImage) {
        this._drawLayerCanvasImage(baseLayerImage[0], baseLayerImage[1], targetWidth, targetHeight);
        this._drawFog();
    }

    len = images.length;
    const start = interacting && limit >= 0 && len > limit ? len - limit : 0;
    for (let i = start; i < len; i++) {
        this._drawLayerCanvasImage(images[i][0], images[i][1], targetWidth, targetHeight);
    }

    /**
     * renderend event, an event fired when map ends rendering.
     * @event Map#renderend
     * @type {Object}
     * @property {String} type                      - renderend
     * @property {Map} target              - the map fires event
     * @property {CanvasRenderingContext2D} context - canvas context
     */
    map._fireEvent('renderend', {
        'context': this.context
    });
    return true;
}
