class ParticleLayer extends CanvasLayer {

    /**
     * Interface method to get particles's position at time t.
     * @param  {Number} t - current time in milliseconds
     */
    getParticles() {
    }

    draw(context, view) {
        const points = this.getParticles(now());
        if (!points || points.length === 0) {
            const renderer = this._getRenderer();
            if (renderer) {
                this._getRenderer()._shouldClear = true;
            }
            return;
        }
        const map = this.getMap();
        let extent = view.extent;
        if (view.maskExtent) {
            extent = view.extent.intersection(view.maskExtent);
        }
        extent = extent.convertTo(c => map._pointToContainerPoint(c, undefined, 0, TEMP_POINT));
        const e = 2 * Math.PI;
        for (let i = 0, l = points.length; i < l; i++) {
            const pos = points[i].point;
            if (extent.contains(pos)) {
                const color = points[i].color || this.options['lineColor'] || '#fff',
                    r = points[i].r;
                if (context.fillStyle !== color) {
                    context.fillStyle = color;
                }
                if (r <= 2) {
                    context.fillRect(pos.x - r / 2, pos.y - r / 2, r, r);
                } else {
                    context.beginPath();
                    context.arc(pos.x, pos.y, r / 2, 0, e);
                    context.fill();
                }
            }
        }
        this._fillCanvas(context);
    }

    _fillCanvas(context) {
        const g = context.globalCompositeOperation;
        context.globalCompositeOperation = 'destination-out';
        const trail = this.options['trail'] || 30;
        context.fillStyle = 'rgba(0, 0, 0, ' + (1 / trail) + ')';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.globalCompositeOperation = g;
    }
}
