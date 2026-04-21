class UIMarker extends Handlerable(UIComponent) {

    /**
     * As it's renderered by HTMLElement such as a DIV, it: <br>
     * 1. always on the top of all the map layers <br>
     * 2. can't be snapped as it's not drawn on the canvas. <br>
     * @param  {Coordinate} coordinate - UIMarker's coordinates
     * @param {Object} options - options defined in [UIMarker]{@link UIMarker#options}
     */
    constructor(coordinate, options) {
        super(options);
        this._markerCoord = new Coordinate(coordinate);
    }

    // TODO: obtain class in super
    _getClassName() {
        return 'UIMarker';
    }

    /**
     * Sets the coordinates
     * @param {Coordinate} coordinates - UIMarker's coordinate
     * @returns {UIMarker} this
     * @fires UIMarker#positionchange
     */
    setCoordinates(coordinates) {
        this._markerCoord = coordinates;
        /**
         * positionchange event.
         *
         * @event ui.UIMarker#positionchange
         * @type {Object}
         * @property {String} type - positionchange
         * @property {UIMarker} target - ui marker
         */
        this.fire('positionchange');
        if (this.isVisible()) {
            this._coordinate = this._markerCoord;
            this._setPosition();
            this._collides();
        }
        return this;
    }

    /**
     * Gets the coordinates
     * @return {Coordinate} coordinates
     */
    getCoordinates() {
        return this._markerCoord;
    }

    //accord with isSupport for tooltip
    getCenter() {
        return this.getCoordinates();
    }

    // for infowindow
    getAltitude() {
        const coordinates = this.getCoordinates() || {};
        if (isNumber(coordinates.z)) {
            return coordinates.z;
        }
        return this.options.altitude || 0;
    }

    setAltitude(alt) {
        if (isNumber(alt) && this._markerCoord) {
            this._markerCoord.z = alt;
            if (this._updatePosition) {
                this._updatePosition();
                this._collides();
            }
        }
        return this;
    }

    /**
     * Sets the content of the UIMarker
     * @param {String|HTMLElement} content - UIMarker's content
     * @returns {UIMarker} this
     * @fires UIMarker#contentchange
     */
    setContent(content) {
        const old = this.options['content'];
        this.options['content'] = content;
        /**
         * contentchange event.
         *
         * @event ui.UIMarker#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {UIMarker} target - ui marker
         * @property {String|HTMLElement} old      - old content
         * @property {String|HTMLElement} new      - new content
         */
        this.fire('contentchange', {
            'old': old,
            'new': content
        });
        if (this.isVisible()) {
            this.show();
        }
        return this;
    }

    /**
     * Gets the content of the UIMarker
     * @return {String|HTMLElement} content
     */
    getContent() {
        return this.options['content'];
    }

    onAdd() {
        this.show();
    }

    /**
     * Show the UIMarker
     * @returns {UIMarker} this
     * @fires UIMarker#showstart
     * @fires UIMarker#showend
     */
    show() {
        return super.show(this._markerCoord);
    }

    /**
     * Flash the UIMarker, show and hide by certain internal for times of count.
     *
     * @param {Number} [interval=100]     - interval of flash, in millisecond (ms)
     * @param {Number} [count=4]          - flash times
     * @param {Function} [cb=null]        - callback function when flash ended
     * @param {*} [context=null]          - callback context
     * @return {UIMarker} this
     */
    flash(interval, count, cb, context) {
        return flash.call(this, interval, count, cb, context);
    }

    /**
     * A callback method to build UIMarker's HTMLElement
     * @protected
     * @param {Map} map - map to be built on
     * @return {HTMLElement} UIMarker's HTMLElement
     */
    buildOn() {
        let dom;
        const content = this.options['content'];
        const isStr = isString(content);
        if (isStr || isFunction(content)) {
            dom = createEl('div');
            if (isStr) {
                dom.innerHTML = this.options['content'];
            } else {
                //dymatic render dom content
                content.bind(this)(dom);
            }
        } else {
            dom = this.options['content'];
        }
        if (this.options['containerClass']) {
            dom.className = this.options['containerClass'];
        }
        this._registerDOMEvents(dom);
        return dom;
    }

    /**
     * Gets UIMarker's HTMLElement's position offset, it's caculated dynamically accordiing to its actual size.
     * @protected
     * @return {Point} offset
     */
    getOffset() {
        const size = this.getSize();
        //default is middle
        let offsetX = -size.width / 2, offsetY = -size.height / 2;
        const { horizontalAlignment, verticalAlignment } = this.options;
        if (horizontalAlignment === 'left') {
            offsetX = -size.width;
        } else if (horizontalAlignment === 'right') {
            offsetX = 0;
        }
        if (verticalAlignment === 'top') {
            offsetY = -size.height;
        } else if (verticalAlignment === 'bottom') {
            offsetY = 0;
        }
        return new Point(offsetX, offsetY);
    }

    /**
     * Gets UIMarker's transform origin for animation transform
     * @protected
     * @return {Point} transform origin
     */
    getTransformOrigin() {
        return 'center center';
    }

    onDomRemove() {
        const dom = this.getDOM();
        this._removeDOMEvents(dom);
    }

    /**
     * Whether the uimarker is being dragged.
     * @returns {Boolean}
     */
    isDragging() {
        if (this['draggable']) {
            return this['draggable'].isDragging();
        }
        return false;
    }

    _registerDOMEvents(dom) {
        on(dom, domEvents, this._onDomEvents, this);
    }

    _onDomEvents(e) {
        const event = this.getMap()._parseEvent(e, e.type);
        const type = e.type;
        if (type === 'mousedown') {
            this._mousedownEvent = e;
        }
        if (type === 'mouseup') {
            this._mouseupEvent = e;
        }
        if (type === 'click' && this._mouseClickPositionIsChange()) {
            return;
        }
        if (type === 'touchstart') {
            this._touchstartTime = now();
        }
        this.fire(e.type, event);
        // Mobile device simulation click event
        if (type === 'touchend' && Browser.touch) {
            const clickTimeThreshold = this.getMap().options.clickTimeThreshold || 280;
            if (now() - this._touchstartTime < clickTimeThreshold) {
                this._onDomEvents(extend({}, e, { type: 'click' }));
            }
        }
    }

    _removeDOMEvents(dom) {
        off(dom, domEvents, this._onDomEvents, this);
    }

    _mouseClickPositionIsChange() {
        const { x: x1, y: y1 } = this._mousedownEvent || {};
        const { x: x2, y: y2 } = this._mouseupEvent || {};
        return (x1 !== x2 || y1 !== y2);
    }

    /**
     * Get the connect points of panel for connector lines.
     * @private
     */
    _getConnectPoints() {
        const map = this.getMap();
        const containerPoint = map.coordToContainerPoint(this.getCoordinates());
        const size = this.getSize(),
            width = size.width,
            height = size.height;
        const anchors = [
            //top center
            map.containerPointToCoordinate(
                containerPoint.add(-width / 2, 0)
            ),
            //middle right
            map.containerPointToCoordinate(
                containerPoint.add(width / 2, 0)
            ),
            //bottom center
            map.containerPointToCoordinate(
                containerPoint.add(0, height / 2)
            ),
            //middle left
            map.containerPointToCoordinate(
                containerPoint.add(0, -height / 2)
            )

        ];
        return anchors;
    }

    _getViewPoint() {
        let alt = 0;
        if (this._owner) {
            const altitude = this.getAltitude();
            if (altitude > 0) {
                alt = this._meterToPoint(this._coordinate, altitude);
            }
        }
        return this.getMap().coordToViewPoint(this._coordinate, undefined, alt)
            ._add(this.options['dx'], this.options['dy']);
    }

    _getDefaultEvents() {
        return extend({}, super._getDefaultEvents(), { 'zooming zoomend': this.onZoomFilter });
    }

    _setPosition() {
        //show/hide zoomFilter
        this.onZoomFilter();
        super._setPosition();
    }

    onZoomFilter() {
        const dom = this.getDOM();
        if (!dom) return;
        if (!this.isVisible() && dom.style.display !== 'none') {
            dom.style.display = 'none';
        } else if (this.isVisible() && dom.style.display === 'none') {
            dom.style.display = '';
        }
    }

    isVisible() {
        const map = this.getMap();
        if (!map) {
            return false;
        }
        if (!this.options['visible']) {
            return false;
        }
        const zoom = map.getZoom();
        const { minZoom, maxZoom } = this.options;
        if (!isNil(minZoom) && zoom < minZoom || (!isNil(maxZoom) && zoom > maxZoom)) {
            return false;
        }
        const dom = this.getDOM();
        return dom && true;
    }

    isSupportZoomFilter() {
        return true;
    }
}
