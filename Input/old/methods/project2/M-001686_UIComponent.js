show(coordinate) {
    const map = this.getMap();
    if (!map) {
        return this;
    }
    this.options['visible'] = true;

    coordinate = coordinate || this._coordinate || this._owner.getCenter();
    if (!(coordinate instanceof Coordinate)) {
        coordinate = new Coordinate(coordinate);
    }

    const visible = this.isVisible();

    /**
     * showstart event.
     *
     * @event ui.UIComponent#showstart
     * @type {Object}
     * @property {String} type - showstart
     * @property {ui.UIComponent} target - UIComponent
     */
    if (!this._showBySymbolChange) {
        this.fire('showstart');
    }
    const container = this._getUIContainer();
    this._coordinate = coordinate;
    //when single will off map events
    this._removePrevDOM();
    if (!this._mapEventsOn) {
        this._switchMapEvents('on');
    }
    const dom = this.__uiDOM = this.buildOn(map);
    dom['eventsPropagation'] = this.options['eventsPropagation'];
    this._observerDomSize(dom);
    const zIndex = this.options.zIndex;
    if (!dom) {
        /**
         * showend event.
         *
         * @event ui.UIComponent#showend
         * @type {Object}
         * @property {String} type - showend
         * @property {ui.UIComponent} target - UIComponent
         */
        if (!this._showBySymbolChange) {
            this.fire('showend');
        }
        this._collides();
        this.setZIndex(zIndex);
        return this;
    }

    this._measureSize(dom);

    if (this._singleton()) {
        dom._uiComponent = this;
        map[this._uiDomKey()] = dom;
    }

    this._setPosition();

    dom.style[TRANSITION] = null;

    container.appendChild(dom);


    const anim = this._getAnimation();

    if (visible) {
        anim.ok = false;
    }

    if (anim.ok) {
        if (anim.fade) {
            dom.style.opacity = 0;
        }
        if (anim.scale) {
            if (this.getTransformOrigin) {
                const origin = this.getTransformOrigin();
                dom.style[TRANSFORMORIGIN] = origin;
            }
            dom.style[TRANSFORM] = this._toCSSTranslate(this._pos) + ' scale(0)';
        }
    }
    //not support zoom filter show dom
    if (!this.isSupportZoomFilter()) {
        dom.style.display = '';
    }

    if (this.options['eventsToStop']) {
        on(dom, this.options['eventsToStop'], stopPropagation);
    }

    // //autoPan
    // if (this.options['autoPan']) {
    //     this._autoPan();
    // }

    const transition = anim.transition;
    if (anim.ok && transition) {
        /* eslint-disable no-unused-expressions */
        // trigger transition
        dom.offsetHeight;
        /* eslint-enable no-unused-expressions */
        if (transition) {
            dom.style[TRANSITION] = transition;
        }
        if (anim.fade) {
            dom.style.opacity = 1;
        }
        if (anim.scale) {
            dom.style[TRANSFORM] = this._toCSSTranslate(this._pos) + ' scale(1)';
        }
    }
    if (!this._showBySymbolChange) {
        this.fire('showend');
    }
    this._collides();
    //autoPan
    clearTimeout(this._autoPanId);
    if (this.options['autoPan']) {
        this._autoPanId = setTimeout(() => {
            this._autoPan();
        }, 32);
    }
    this.setZIndex(zIndex);
    return this;
}
