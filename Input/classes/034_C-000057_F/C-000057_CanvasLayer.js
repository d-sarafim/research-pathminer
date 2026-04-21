class CanvasLayer extends Layer {

    isCanvasRender() {
        return true;
    }

    /**
     * An optional interface function called only once before the first draw, useful for preparing your canvas operations.
     * @param  {CanvasRenderingContext2D } context - CanvasRenderingContext2D of the layer canvas.
     * @return {Object[]} objects that will be passed to function draw(context, ..) as parameters.
     */
    prepareToDraw() {}

    /**
     * The required interface function to draw things on the layer canvas.
     * @param  {CanvasRenderingContext2D} context - CanvasRenderingContext2D of the layer canvas.
     * @param  {*} params.. - parameters returned by function prepareToDraw(context).
     */
    draw() {}

    /**
     * An optional interface function to draw while map is interacting.
     * By default, it will call draw method instead.
     * You can override this method if you are clear with what to draw when interacting to improve performance.
     * @param  {CanvasRenderingContext2D} context - CanvasRenderingContext2D of the layer canvas.
     * @param  {*} params.. - parameters returned by function prepareToDraw(context).
     */
    // drawOnInteracting() {
    //     return this.draw.apply(this, arguments);
    // }

    /**
     * Redraw the layer
     * @return {CanvasLayer} this
     */
    redraw() {
        if (this._getRenderer()) {
            this._getRenderer().setToRedraw();
        }
        return this;
    }

    /**
     * Start animation
     * @return {CanvasLayer} this
     */
    play() {
        this.config('animation', true);
        return this;
    }

    /**
     * Pause the animation
     * @return {CanvasLayer} this
     */
    pause() {
        this.config('animation', false);
        return this;
    }

    /**
     * If the animation is playing
     * @return {Boolean}
     */
    isPlaying() {
        return this.options['animation'];
    }

    /**
     * Clear layer's canvas
     * @return {CanvasLayer} this
     */
    clearCanvas() {
        if (this._getRenderer()) {
            this._getRenderer().clearCanvas();
        }
        return this;
    }

    /**
     * Ask the map to redraw the layer canvas without firing any event.
     * @return {CanvasLayer} this
     */
    requestMapToRender() {
        if (this._getRenderer()) {
            this._getRenderer().requestMapToRender();
        }
        return this;
    }

    /**
     * Ask the map to redraw the layer canvas and fire layerload event
     * @return {CanvasLayer} this
     */
    completeRender() {
        if (this._getRenderer()) {
            this._getRenderer().completeRender();
        }
        return this;
    }

    /**
     * Callback function when layer's canvas is created. <br>
     * Override it to do anything needed.
     */
    onCanvasCreate() {
        return this;
    }

    /**
     * The event callback for map's zoomstart event.
     * @param  {Object} param - event parameter
     */
    onZoomStart() {}

    /**
     * The event callback for map's zooming event.
     * @param  {Object} param - event parameter
     */
    onZooming() {}

    /**
     * The event callback for map's zoomend event.
     * @param  {Object} param - event parameter
     */
    onZoomEnd() {}

    /**
     * The event callback for map's movestart event.
     * @param  {Object} param - event parameter
     */
    onMoveStart() {}

    /**
     * The event callback for map's moving event.
     * @param  {Object} param - event parameter
     */
    onMoving() {}

    /**
     * The event callback for map's moveend event.
     * @param  {Object} param - event parameter
     */
    onMoveEnd() {}

    /**
     * The event callback for map's resize event.
     * @param  {Object} param - event parameter
     */
    onResize() {}

    /**
     * The callback function to double buffer. <br>
     * In default, it just draws and return, and you can override it if you need to process the canvas image before drawn.
     * @param  {CanvasRenderingContext2D} bufferContext CanvasRenderingContext2D of double buffer of the layer canvas.
     * @param  {CanvasRenderingContext2D} context CanvasRenderingContext2D of the layer canvas.
     */
    doubleBuffer(bufferContext/*, context*/) {
        bufferContext.clearRect(0, 0, bufferContext.canvas.width, bufferContext.canvas.height);
        return this;
    }
}
