_clip(points, altitude) {
    // linestring polygon clip
    if (isNumber(altitude) && altitude !== 0) {
        return {
            points,
            altitude
        };
    }
    if (Array.isArray(altitude)) {
        let hasAltitude = false;
        for (let i = 0, len = altitude.length; i < len; i++) {
            if (altitude[i] !== 0) {
                hasAltitude = true;
                break;
            }
        }
        if (hasAltitude) {
            return {
                points,
                altitude
            };
        }
    }
    const map = this.getMap(),
        geometry = this.geometry;
    let lineWidth = this.getSymbol()['lineWidth'];
    if (!isNumber(lineWidth)) {
        lineWidth = 4;
    }
    const renderer = this.getLayer()._getRenderer();
    const mapStateCache = renderer.mapStateCache;
    let _2DExtent, glExtent, pitch;
    if (mapStateCache) {
        _2DExtent = mapStateCache._2DExtent;
        glExtent = mapStateCache.glExtent;
        pitch = mapStateCache.pitch;
    } else {
        _2DExtent = map._get2DExtent();
        glExtent = map._get2DExtentAtRes(map.getGLRes());
        pitch = map.getPitch();
    }
    let extent2D = _2DExtent._expand(lineWidth);
    if (pitch > 0 && altitude) {
        const c = map.cameraLookAt;
        const pos = map.cameraPosition;
        //add [1px, 1px] towards camera's lookAt
        TEMP_POINT0.set(pos.x, pos.y);
        extent2D = extent2D._combine(TEMP_POINT0._add(sign(c[0] - pos[0]), sign(c[1] - pos[1])));
    }
    const e = this.get2DExtent(null, TEMP_CLIP_EXTENT1);
    let clipPoints = points;
    if (e.within(extent2D)) {
        // if (this.geometry.getJSONType() === 'LineString') {
        //     // clip line with altitude
        //     return this._clipLineByAlt(clipPoints, altitude);
        // }
        return {
            points: clipPoints,
            altitude: altitude,
            inView: true
        };
    }
    const glExtent2D = glExtent._expand(lineWidth * map._glScale);

    TEMP_CLIP_EXTENT0.xmin = glExtent2D.xmin;
    TEMP_CLIP_EXTENT0.xmax = glExtent2D.xmax;
    TEMP_CLIP_EXTENT0.ymin = glExtent2D.ymin;
    TEMP_CLIP_EXTENT0.ymax = glExtent2D.ymax;

    const smoothness = geometry.options['smoothness'];
    // if (this.geometry instanceof Polygon) {
    if (geometry.getShell && this.geometry.getHoles && !smoothness) {
        //polygon buffer clip bbox
        const { xmin, ymin, xmax, ymax } = glExtent2D;
        const dx = Math.abs(xmax - xmin), dy = Math.abs(ymax - ymin);
        const r = Math.sqrt(dx * dx + dy * dy);
        const rx = (r - dx) / 2, ry = (r - dy) / 2;
        TEMP_CLIP_EXTENT0.xmin = glExtent2D.xmin - rx;
        TEMP_CLIP_EXTENT0.xmax = glExtent2D.xmax + rx;
        TEMP_CLIP_EXTENT0.ymin = glExtent2D.ymin - ry;
        TEMP_CLIP_EXTENT0.ymax = glExtent2D.ymax + ry;
        // clip the polygon to draw less and improve performance
        if (!Array.isArray(points[0])) {
            clipPoints = clipPolygon(points, TEMP_CLIP_EXTENT0);
        } else {
            clipPoints = [];
            for (let i = 0; i < points.length; i++) {
                const part = clipPolygon(points[i], TEMP_CLIP_EXTENT0);
                if (part.length) {
                    clipPoints.push(part);
                }
            }
        }
    } else if (geometry.getJSONType() === 'LineString' && !smoothness) {
        // clip the line string to draw less and improve performance
        if (!Array.isArray(points[0])) {
            clipPoints = clipLine(points, TEMP_CLIP_EXTENT0, false, !!smoothness);
        } else {
            clipPoints = [];
            for (let i = 0; i < points.length; i++) {
                pushIn(clipPoints, clipLine(points[i], TEMP_CLIP_EXTENT0, false, !!smoothness));
            }
        }
        //interpolate line's segment's altitude if altitude is an array
        return this._interpolateSegAlt(clipPoints, points, altitude);
        // const segs = this._interpolateSegAlt(clipPoints, points, altitude);
        // return this._clipLineByAlt(segs.points, segs.altitude);
    }

    return {
        points: clipPoints,
        altitude: altitude
    };
}
