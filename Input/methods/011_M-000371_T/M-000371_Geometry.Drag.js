_dragging(param) {
    const target = this.target;
    const map = target.getMap(),
        e = map._parseEvent(param['domEvent']);

    const domEvent = e['domEvent'];
    if (domEvent.touches && domEvent.touches.length > 1) {
        return;
    }
    const visualHeight = map._getVisualHeight(map.options['maxVisualPitch']);
    if (e.containerPoint.y < map.height - visualHeight) {
        return;
    }
    if (!this._moved) {
        this._moved = true;
        target.on('symbolchange', this._onTargetUpdated, this);
        this._isDragging = true;
        this._prepareShadow();
        if (this._shadow) {
            if (!target.options['dragShadow']) {
                target.hide();
            }
            this._shadow._fireEvent('dragstart', e);
        }
        /**
         * drag start event
         * @event Geometry#dragstart
         * @type {Object}
         * @property {String} type           - dragstart
         * @property {Geometry} target       - the geometry fires event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this.target._fireEvent('dragstart', this._startParam || e);
        delete this._startParam;
        return;
    }
    const geo = this._shadow || target;
    const axis = geo.options['dragOnAxis'],
        dragOnScreenAxis = geo.options['dragOnScreenAxis'],
        point = e['containerPoint'];
    let coord = e['coordinate'];
    this._lastPoint = this._lastPoint || point;
    this._lastCoord = this._lastCoord || coord;
    // drag direction is ScreenCoordinates,The direction of the drag has nothing to do with the map rotation(bearing)
    if (dragOnScreenAxis) {
        if (axis === 'x') {
            point.y = this._lastPoint.y;
        } else if (axis === 'y') {
            point.x = this._lastPoint.x;
        }
        coord = map.containerPointToCoord(point);
    } else {
        coord = this._correctCoord(coord);
    }
    const pointOffset = point.sub(this._lastPoint);
    const coordOffset = coord.sub(this._lastCoord);
    if (!dragOnScreenAxis) {
        if (axis === 'x') {
            pointOffset.y = coordOffset.y = 0;
        } else if (axis === 'y') {
            pointOffset.x = coordOffset.x = 0;
        }
    }
    this._lastPoint = point;
    this._lastCoord = coord;
    geo.translate(coordOffset);
    if (geo !== target && !target.options['dragShadow']) {
        target.translate(coordOffset);
    }
    e['coordOffset'] = coordOffset;
    e['pointOffset'] = pointOffset;
    geo._fireEvent('dragging', e);

    /**
     * dragging event
     * @event Geometry#dragging
     * @type {Object}
     * @property {String} type                    - dragging
     * @property {Geometry} target       - the geometry fires event
     * @property {Coordinate} coordinate - coordinate of the event
     * @property {Point} containerPoint  - container point of the event
     * @property {Point} viewPoint       - view point of the event
     * @property {Event} domEvent                 - dom event
     */
    if (geo !== target) {
        target._fireEvent('dragging', e);
    }
}
