class UIMarkerDragHandler extends Handler {

    constructor(target) {
        super(target);
    }

    addHooks() {
        this.target.on(EVENTS, this._startDrag, this);
    }

    removeHooks() {
        this.target.off(EVENTS, this._startDrag, this);
    }

    _startDrag(param) {
        const domEvent = param['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1 || domEvent.button === 2) {
            return;
        }
        if (this.isDragging()) {
            return;
        }
        this.target.on('click', this._endDrag, this);
        this._lastCoord = param['coordinate'];
        this._lastPoint = param['containerPoint'];

        this._prepareDragHandler();
        this._dragHandler.onMouseDown(param['domEvent']);
        /**
         * drag start event
         * @event ui.UIMarker#dragstart
         * @type {Object}
         * @property {String} type                    - dragstart
         * @property {UIMarker} target    - the uimarker fires event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this.target.fire('dragstart', param);
    }

    _prepareDragHandler() {
        this._dragHandler = new DragHandler(this.target.getDOM(), {
            'cancelOn': this._cancelOn.bind(this),
            'ignoreMouseleave': true
        });
        this._dragHandler.on('mousedown', this._onMouseDown, this);
        this._dragHandler.on('dragging', this._dragging, this);
        this._dragHandler.on('mouseup', this._endDrag, this);
        this._dragHandler.enable();
    }

    _cancelOn(domEvent) {
        const target = domEvent.srcElement || domEvent.target,
            tagName = target.tagName.toLowerCase();
        if (tagName === 'button' ||
            tagName === 'input' ||
            tagName === 'select' ||
            tagName === 'option' ||
            tagName === 'textarea') {
            return true;
        }
        return false;
    }

    _onMouseDown(param) {
        stopPropagation(param['domEvent']);
    }

    _dragging(param) {
        const target = this.target,
            map = target.getMap(),
            eventParam = map._parseEvent(param['domEvent']),
            domEvent = eventParam['domEvent'];
        if (domEvent.touches && domEvent.touches.length > 1) {
            return;
        }
        if (!this._isDragging) {
            this._isDragging = true;
            return;
        }

        const coord = eventParam['coordinate'],
            point = eventParam['containerPoint'];
        if (!this._lastCoord) {
            this._lastCoord = coord;
        }
        if (!this._lastPoint) {
            this._lastPoint = point;
        }
        const coordOffset = coord.sub(this._lastCoord),
            pointOffset = point.sub(this._lastPoint);
        this._lastCoord = coord;
        this._lastPoint = point;
        this.target.setCoordinates(this.target.getCoordinates().add(coordOffset));
        eventParam['coordOffset'] = coordOffset;
        eventParam['pointOffset'] = pointOffset;

        /**
         * dragging event
         * @event ui.UIMarker#dragging
         * @type {Object}
         * @property {String} type                    - dragging
         * @property {UIMarker} target    - the uimarker fires event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        target.fire('dragging', eventParam);

    }

    _endDrag(param) {
        const target = this.target,
            map = target.getMap();
        if (this._dragHandler) {
            target.off('click', this._endDrag, this);
            this._dragHandler.disable();
            delete this._dragHandler;
        }
        delete this._lastCoord;
        delete this._lastPoint;
        this._isDragging = false;
        if (!map) {
            return;
        }
        const eventParam = map._parseEvent(param['domEvent']);
        /**
         * dragend event
         * @event ui.UIMarker#dragend
         * @type {Object}
         * @property {String} type                    - dragend
         * @property {UIMarker} target    - the uimarker fires event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        if (target && target._mouseClickPositionIsChange && target._mouseClickPositionIsChange()) {
            target.fire('dragend', eventParam);
        }

    }

    isDragging() {
        if (!this._isDragging) {
            return false;
        }
        return true;
    }
}
