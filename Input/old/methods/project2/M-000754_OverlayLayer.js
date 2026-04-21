addGeometry(geometries, fitView) {
    if (!geometries) {
        return this;
    }
    if (geometries.type === 'FeatureCollection') {
        return this.addGeometry(GeoJSON.toGeometry(geometries), fitView);
    } else if (!Array.isArray(geometries)) {
        const count = arguments.length;
        const last = arguments[count - 1];
        geometries = Array.prototype.slice.call(arguments, 0, count - 1);
        fitView = last;
        if (last && isObject(last) && (('type' in last) || last instanceof Geometry)) {
            geometries.push(last);
            fitView = false;
        }
        return this.addGeometry(geometries, fitView);
    } else if (geometries.length === 0) {
        return this;
    }
    this._initCache();
    let extent;
    if (fitView) {
        extent = new Extent();
    }
    this._toSort = this._maxZIndex > 0;
    const geos = [];
    for (let i = 0, l = geometries.length; i < l; i++) {
        let geo = geometries[i];
        if (!geo) {
            throw new Error('Invalid geometry to add to layer(' + this.getId() + ') at index:' + i);
        }
        if (geo.getLayer && geo.getLayer() === this) {
            continue;
        }
        if (!(geo instanceof Geometry)) {
            geo = Geometry.fromJSON(geo);
            if (Array.isArray(geo)) {
                for (let ii = 0, ll = geo.length; ii < ll; ii++) {
                    this._add(geo[ii], extent, i);
                    geos.push(geo[ii]);
                }
            }
        }
        if (!Array.isArray(geo)) {
            this._add(geo, extent, i);
            geos.push(geo);
        }
    }
    const map = this.getMap();
    if (map) {
        this._getRenderer().onGeometryAdd(geos);
        if (extent && !isNil(extent.xmin)) {
            const center = extent.getCenter();
            const z = map.getFitZoom(extent);

            if (isObject(fitView)) {
                const step = isFunction(fitView.step) ? fitView.step : () => undefined;
                map.animateTo({
                    center,
                    zoom: z,
                }, extend({
                    duration: map.options.zoomAnimationDuration,
                    easing: 'out',
                }, fitView), step);
            } else if (fitView === true) {
                map.setCenterAndZoom(center, z);
            }
        }
    }
    /**
     * addgeo event.
     *
     * @event OverlayLayer#addgeo
     * @type {Object}
     * @property {String} type - addgeo
     * @property {OverlayLayer} target - layer
     * @property {Geometry[]} geometries - the geometries to add
     */
    this.fire('addgeo', {
        'geometries': geometries
    });
    return this;
}
