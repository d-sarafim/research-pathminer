_updateContainer() {
    const map = this.getMap(),
        tileZoom = this._tileZoom,
        domMat = map.domCssMatrix,
        container = this._getTileContainer(tileZoom),
        size = map.getSize(),
        fraction = map.getResolution(tileZoom) / map.getResolution(),
        centerOffset = this._centerOffset;
    const containerStyle = container.style;
    if (containerStyle.left) {
        // Remove container's left/top if it has.
        // Left, top is set in onZoomEnd to keep container's position when map platform's offset is reset to 0.
        containerStyle.left = null;
        containerStyle.top = null;
    }
    if (!domMat) {
        let style = '';
        if (centerOffset && !centerOffset.isZero()) {
            const offset = centerOffset.multi(fraction);
            style = Browser.any3d ? 'translate3d(' + offset.x + 'px, ' + offset.y + 'px, 0px) ' :
                'translate(' + offset.x + 'px, ' + offset.y + 'px) ';
        }
        if (fraction !== 1) {
            // fractional zoom
            const matrix = [fraction, 0, 0, fraction, size['width'] / 2 *  (1 - fraction), size['height'] / 2 *  (1 - fraction)];
            style += 'matrix(' + matrix.join() + ')';
        }
        this._resetDomCssMatrix();
        if (style !== '') {
            container.tile.style[TRANSFORM] = style;
        } else {
            removeTransform(container.tile);
        }
        return;
    }

    if (Browser.chrome && Browser.chromeVersion.startsWith('60')) {
        const err =  'DOM TileLayer can\'t pitch or rotate due to a crash bug with chrome 60.';
        if (!this._reported) {
            this._reported = true;
            if (window.confirm(err + ' Click OK to redirect to the bug report.')) {
                window.location.href = 'https://bugs.chromium.org/p/chromium/issues/detail?id=752382&q=&colspec=ID%20Pri%20M%20Stars%20ReleaseBlock%20Component%20Status%20Owner%20Summary%20OS%20Modified&start=200';
                return;
            }
        }
        throw new Error(err);
    }

    // update container when map is rotating or pitching.

    // reduce repaint causing by dom updateing
    this._container.style.display = 'none';
    if (parseInt(containerStyle.width) !== size['width'] || parseInt(containerStyle.height) !== size['height']) {
        containerStyle.width = size['width'] + 'px';
        containerStyle.height = size['height'] + 'px';
    }
    let matrix;
    if (fraction !== 1) {
        const m = new Float32Array();
        if (map.isZooming() && this._zoomParam) {
            const origin = this._zoomParam['origin'],
                // when origin is not in the center with pitch, layer scaling is not fit for map's scaling, add a offset to fix.
                pitch = map.getPitch(),
                offset = [
                    (origin.x - size['width'] / 2)  * (1 - fraction),
                    //FIXME Math.cos(pitch * Math.PI / 180) is just a magic num, works when tilting but may have problem when rotating
                    (origin.y - size['height'] / 2) * (1 - fraction) * (pitch ? Math.cos(pitch * Math.PI / 180) : 1),
                    0
                ];
            mat4.translate(m, m, offset);
        }
        mat4.multiply(m, m, domMat);
        // Fractional zoom, multiply current domCssMat with fraction
        mat4.scale(m, m, [fraction, fraction, 1]);
        matrix = join(m);
    } else {
        matrix = join(domMat);
    }
    const mapOffset = map.getViewPoint().round();
    let tileOffset;
    if (map.isZooming() && !map.isMoving()) {
        // when map is zooming, mapOffset is fixed when zoom starts
        // should multiply with zoom fraction if zoom start from a fractional zoom
        const startFraction = map.getResolution(tileZoom) / map.getResolution(this._startZoom);
        tileOffset = mapOffset.multi(1 / startFraction);
    } else {
        tileOffset = mapOffset.multi(1 / fraction);
    }
    if (centerOffset) {
        tileOffset._add(centerOffset);
    }
    container.tile.style[TRANSFORM] = 'translate3d(' + tileOffset.x + 'px, ' + tileOffset.y + 'px, 0px)';
    containerStyle[TRANSFORM] = 'translate3d(' + (-mapOffset.x) + 'px, ' + (-mapOffset.y) + 'px, 0px) matrix3D(' + matrix + ')';
    this._container.style.display = '';
}
