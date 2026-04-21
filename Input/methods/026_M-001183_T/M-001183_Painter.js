getPaintParams(dx, dy, ignoreAltitude, disableClip, ptkey = '_pt') {
    const renderer = this.getLayer()._getRenderer();
    const mapStateCache = renderer.mapStateCache;
    let resolution, pitch, bearing, glScale, containerExtent;
    const map = this.getMap();
    if (mapStateCache && (!this._hitPoint)) {
        resolution = mapStateCache.resolution;
        pitch = mapStateCache.pitch;
        bearing = mapStateCache.bearing;
        glScale = mapStateCache.glScale;
        containerExtent = mapStateCache.containerExtent;
    } else {
        resolution = map.getResolution();
        pitch = map.getPitch();
        bearing = map.getBearing();
        glScale = map.getGLScale();
        containerExtent = map.getContainerExtent();
    }
    const geometry = this.geometry,
        res = resolution,
        pitched = (pitch !== 0),
        rotated = (bearing !== 0);
    let params = this._cachedParams;

    const paintAsPath = geometry._paintAsPath && geometry._paintAsPath();
    if (paintAsPath && this._unsimpledParams && res <= this._unsimpledParams._res) {
        //if res is smaller, return unsimplified params directly
        params = this._unsimpledParams;
    } else if (!params ||
        // refresh paint params
        // simplified, but not same zoom
        params._res !== resolution ||
        // refresh if requested by geometry
        this._pitched !== pitched && geometry._redrawWhenPitch() ||
        this._rotated !== rotated && geometry._redrawWhenRotate()
    ) {
        //render resources geometry returned are based on 2d points.
        params = geometry._getPaintParams();
        if (!params) {
            return null;
        }
        params._res = res;

        if (!geometry._simplified && paintAsPath) {
            if (!this._unsimpledParams) {
                this._unsimpledParams = params;
            }
            if (res > this._unsimpledParams._res) {
                this._unsimpledParams._res = res;
            }
        }
        this._cachedParams = params;
    }
    if (!params) {
        return null;
    }
    this._pitched = pitched;
    this._rotated = rotated;
    const zoomScale = glScale,
        // paintParams = this._paintParams,
        tr = [], // transformed params
        points = params[0];

    const mapExtent = containerExtent;
    const cPoints = this._pointContainerPoints(points, dx, dy, ignoreAltitude, disableClip || this._hitPoint && !mapExtent.contains(this._hitPoint), null, ptkey);
    if (!cPoints) {
        return null;
    }
    tr.push(cPoints);
    for (let i = 1, l = params.length; i < l; i++) {
        if (isNumber(params[i]) || (params[i] instanceof Size)) {
            if (isNumber(params[i])) {
                tr.push(params[i] / zoomScale);
            } else {
                tr.push(params[i].multi(1 / zoomScale));
            }
        } else {
            tr.push(params[i]);
        }
    }
    return tr;
}
