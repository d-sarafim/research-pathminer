symbolize(ctx, resources) {
    const style = this.style;
    if (!this.painter.isHitTesting() && (style['markerWidth'] === 0 || style['markerHeight'] === 0 ||
        (style['polygonOpacity'] === 0 && style['lineOpacity'] === 0))) {
        return;
    }
    const cookedPoints = this._getRenderContainerPoints();
    if (!isArrayHasData(cookedPoints)) {
        return;
    }
    this._prepareContext(ctx);
    if (this.getPainter().isSpriting() ||
        this.geometry.getLayer().getMask() === this.geometry ||
        this._dynamic ||
        this.geometry.getLayer().options['cacheVectorOnCanvas'] === false) {
        this._drawMarkers(ctx, cookedPoints, resources);
    } else {
        this._drawMarkersWithCache(ctx, cookedPoints, resources);
    }

}
