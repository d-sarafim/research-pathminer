_batchConversionMarkers(glRes) {
    this._onlyHasPoint = undefined;
    if (!this._constructorIsThis()) {
        return [];
    }
    const cPoints = [];
    const markers = [];
    const altitudes = [];
    const altitudeCache = {};
    const layer = this.layer;
    const layerOpts = layer.options;
    const layerAltitude = layer.getAltitude ? layer.getAltitude() : 0;
    const isCanvasRender = layer.isCanvasRender();
    this._onlyHasPoint = true;
    //Traverse all Geo
    let idx = 0;
    for (let i = 0, len = this.layer._geoList.length; i < len; i++) {
        const geo = this.layer._geoList[i];
        const type = geo.getType();
        if (type === 'Point') {
            let painter = geo._painter;
            if (!painter) {
                painter = geo._getPainter();
            }
            const point = painter.getRenderPoints(PLACEMENT_CENTER)[0][0];
            const altitude = layerOpts['enableAltitude'] ? geo._getAltitude() : layerAltitude;
            //减少方法的调用
            if (altitudeCache[altitude] === undefined) {
                altitudeCache[altitude] = painter.getAltitude();
            }
            cPoints[idx] = point;
            altitudes[idx] = altitudeCache[altitude];
            markers[idx] = geo;
            idx++;
        } else {
            this._onlyHasPoint = false;
        }
    }
    if (idx === 0) {
        return [];
    }
    const map = this.getMap();
    let pts = getPointsResultPts(cPoints, '_pt');
    pts = map._pointsAtResToContainerPoints(cPoints, glRes, altitudes, pts);
    const containerExtent = map.getContainerExtent();
    const { xmax, ymax, xmin, ymin } = containerExtent;
    const extentCache = {};
    for (let i = 0, len = markers.length; i < len; i++) {
        const geo = markers[i];
        geo._cPoint = pts[i];
        if (!geo._cPoint) {
            geo._inCurrentView = false;
            continue;
        }
        const { x, y } = pts[i];
        //Is the point in view
        geo._inCurrentView = (x >= xmin && y >= ymin && x <= xmax && y <= ymax);
        //不在视野内的，再用fixedExtent 精确判断下
        if (!geo._inCurrentView) {
            const symbolkey = geo.getSymbolHash();
            let fixedExtent;
            if (symbolkey) {
                //相同的symbol 不要重复计算
                fixedExtent = extentCache[symbolkey] = (extentCache[symbolkey] || geo._painter.getFixedExtent());
            } else {
                fixedExtent = geo._painter.getFixedExtent();
            }
            TEMP_FIXEDEXTENT.set(fixedExtent.xmin, fixedExtent.ymin, fixedExtent.xmax, fixedExtent.ymax);
            TEMP_FIXEDEXTENT._add(pts[i]);
            geo._inCurrentView = TEMP_FIXEDEXTENT.intersects(containerExtent);
        }
        if (geo._inCurrentView) {
            if (!geo.isVisible() || !isCanvasRender) {
                geo._inCurrentView = false;
            }
            //如果当前图层上只有点，整个checkGeo都不用执行了,这里已经把所有的点都判断了
            if (this._onlyHasPoint && geo._inCurrentView) {
                this._hasPoint = true;
                geo._isCheck = true;
                this._geosToDraw.push(geo);
            }
        }
    }
    return pts;
}
