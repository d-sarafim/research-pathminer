start() {
    if (!this._geometry || !this._geometry.getMap() || this._geometry.editing) {
        return;
    }
    this.editing = true;
    this.prepare();
    const geometry = this._geometry;
    let shadow;

    const layer = this._geometry.getLayer();
    const needShadow = layer.options['renderer'] === 'canvas';
    this._geometryDraggble = geometry.options['draggable'];
    if (needShadow) {
        geometry.config('draggable', false);
        //edits are applied to a shadow of geometry to improve performance.
        shadow = geometry.copy();
        shadow.setSymbol(geometry._getInternalSymbol());
        //geometry copy没有将event复制到新建的geometry,对于编辑这个功能会存在一些问题
        //原geometry上可能绑定了其它监听其click/dragging的事件,在编辑时就无法响应了.
        shadow.copyEventListeners(geometry);
        if (geometry._getParent()) {
            shadow.copyEventListeners(geometry._getParent());
        }
        shadow._setEventTarget(geometry);
        //drag shadow by center handle instead.
        shadow.setId(null).config({
            'draggable': false
        });

        this._shadow = shadow;

        geometry.hide();
    } else if (geometry instanceof Marker) {
        geometry.config('draggable', true);
    }

    this._switchGeometryEvents('on');
    if (geometry instanceof Marker ||
        geometry instanceof Circle ||
        geometry instanceof Rectangle ||
        geometry instanceof Ellipse) {
        //ouline has to be added before shadow to let shadow on top of it, otherwise shadow's events will be overrided by outline
        this._createOrRefreshOutline();
    }
    if (this._shadowLayer) {
        this._shadowLayer.bringToFront().addGeometry(shadow);
    }
    if (!(geometry instanceof Marker)) {
        this._createCenterHandle();
    } else if (shadow) {
        shadow.config('draggable', true);
        shadow.on('dragend', this._onMarkerDragEnd, this);
    }
    if ((geometry instanceof Marker) && this.options['resize'] !== false) {
        this.createMarkerEditor();
    } else if (geometry instanceof Circle) {
        this.createCircleEditor();
    } else if (geometry instanceof Rectangle) {
        this.createEllipseOrRectEditor();
    } else if (geometry instanceof Ellipse) {
        this.createEllipseOrRectEditor();
    } else if (geometry instanceof Sector) {
        // TODO: createSectorEditor
    } else if ((geometry instanceof Polygon) ||
        (geometry instanceof LineString)) {
        this.createPolygonEditor();
    }
}
