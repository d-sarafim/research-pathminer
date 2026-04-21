_pointContainerPoints(points, dx, dy, ignoreAltitude, disableClip, pointPlacement, ptkey = '_pt') {
    if (this._aboveCamera()) {
        return null;
    }
    const renderer = this.getLayer()._getRenderer();
    const mapStateCache = renderer.mapStateCache;

    const map = this.getMap(),
        geometry = this.geometry,
        containerOffset = this.containerOffset;
    let glRes, containerExtent;
    if (mapStateCache) {
        glRes = mapStateCache.glRes;
        containerExtent = mapStateCache.containerExtent;
    } else {
        glRes = map.getGLRes();
        containerExtent = map.getContainerExtent();
    }
    let cPoints;
    const roundPoint = this.getLayer().options['roundPoint'];
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    let needClip = !disableClip;
    const clipBBoxBufferSize = renderer.layer.options['clipBBoxBufferSize'] || 3;
    const symbolizers = this.symbolizers;

    function pointsContainerPoints(viewPoints = [], alts = []) {
        let pts = getPointsResultPts(viewPoints, ptkey);
        pts = map._pointsAtResToContainerPoints(viewPoints, glRes, alts, pts);
        for (let i = 0, len = pts.length; i < len; i++) {
            const p = pts[i];
            p._sub(containerOffset);
            if (dx || dy) {
                p._add(dx || 0, dy || 0);
            }
            if (roundPoint) {
                //使用 round 会导致左右波动，用floor,ceil 要好点
                p.x = Math.ceil(p.x);
                p.y = Math.ceil(p.y);
            }
            minx = Math.min(p.x, minx);
            miny = Math.min(p.y, miny);
            maxx = Math.max(p.x, maxx);
            maxy = Math.max(p.y, maxy);
        }
        if (needClip && isDashLine(symbolizers)) {
            TEMP_CLIP_EXTENT2.ymin = containerExtent.ymin;
            if (TEMP_CLIP_EXTENT2.ymin < clipBBoxBufferSize) {
                TEMP_CLIP_EXTENT2.ymin = containerExtent.ymin - clipBBoxBufferSize;
            }
            TEMP_CLIP_EXTENT2.xmin = containerExtent.xmin - clipBBoxBufferSize;
            TEMP_CLIP_EXTENT2.xmax = containerExtent.xmax + clipBBoxBufferSize;
            TEMP_CLIP_EXTENT2.ymax = containerExtent.ymax + clipBBoxBufferSize;
            if (geometry.getShell && geometry.getHoles) {
                return clipPolygon(pts, TEMP_CLIP_EXTENT2);
            }
            const clipPts = clipLine(pts, TEMP_CLIP_EXTENT2, false);
            if (clipPts.length) {
                const points = [];
                clipPts.forEach(clipPt => {
                    for (let i = 0, len = clipPt.length; i < len; i++) {
                        points.push(clipPt[i].point);
                    }
                });
                return points;
            }
        }
        return pts;
    }

    let altitude = this.getAltitude();

    //convert 2d points to container points needed by canvas
    if (Array.isArray(points)) {
        const geometry = this.geometry;
        let clipped;
        if (!disableClip && geometry.options['enableClip']) {
            clipped = this._clip(points, altitude);
            if (clipped.inView) {
                needClip = false;
            }
        } else {
            clipped = {
                points: points,
                altitude: altitude
            };
        }
        const clipPoints = clipped.points;
        altitude = clipped.altitude;
        if (ignoreAltitude) {
            altitude = 0;
        }
        let alt = altitude;
        cPoints = [];
        const alts = [];
        const altitudeIsNumber = isNumber(altitude);
        for (let i = 0, l = clipPoints.length; i < l; i++) {
            const c = clipPoints[i];
            if (Array.isArray(c)) {
                // const cring = [];
                //polygon rings or clipped line string
                if (altitudeIsNumber) {
                    const cring = pointsContainerPoints(c, altitude);
                    cPoints.push(cring);
                    continue;
                }
                const altArray = [];
                for (let ii = 0, ll = c.length; ii < ll; ii++) {
                    // const cc = c[ii];
                    if (Array.isArray(altitude)) {
                        if (altitude[i]) {
                            alt = altitude[i][ii];
                        } else {
                            alt = 0;
                        }
                    }
                    altArray.push(alt);
                }
                const cring = pointsContainerPoints(c, altArray);
                cPoints.push(cring);
            } else {
                //line string
                if (Array.isArray(altitude)) {
                    // altitude of different placement for point symbolizers
                    if (pointPlacement === 'vertex-last') {
                        alt = altitude[altitude.length - 1 - i];
                    } else if (pointPlacement === 'line') {
                        alt = (altitude[i] + altitude[i + 1]) / 2;
                    } else {
                        //vertex, vertex-first
                        alt = altitude[i];
                    }
                }
                alts.push(alt);
            }
        }
        if (alts.length) {
            cPoints = pointsContainerPoints(clipPoints, alts);
        }
    } else if (points instanceof Point) {
        if (ignoreAltitude) {
            altitude = 0;
        }
        cPoints = map._pointAtResToContainerPoint(points, glRes, altitude)._sub(containerOffset);
        if (dx || dy) {
            cPoints._add(dx, dy);
        }
    }
    //cache geometry bbox
    TEMP_BBOX.minx = minx;
    TEMP_BBOX.miny = miny;
    TEMP_BBOX.maxx = maxx;
    TEMP_BBOX.maxy = maxy;
    this._containerBbox = TEMP_BBOX;
    return cPoints;
}
