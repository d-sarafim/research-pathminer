class Zoom extends Control {
    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn(map) {
        const options = this.options;

        const dom = createEl('div', 'maptalks-zoom');

        if (options['zoomLevel']) {
            const levelWrapper = createEl('span', 'maptalks-zoom-zoomlevel');
            const levelDOM = createEl('span', 'maptalks-zoom-zoomlevel-text');
            levelWrapper.appendChild(levelDOM);
            dom.appendChild(levelWrapper);
            this._levelDOM = levelDOM;
        }

        const zoomDOM = createEl('div', 'maptalks-zoom-slider');

        const zoomInButton = createEl('a', 'maptalks-zoom-zoomin');
        zoomInButton.href = 'javascript:;';
        zoomDOM.appendChild(zoomInButton);
        this._zoomInButton = zoomInButton;

        // if (options['slider']) {
        //     const box = createEl('div', 'maptalks-zoom-slider-box');
        //     const ruler = createEl('div', 'maptalks-zoom-slider-ruler');
        //     const reading = createEl('span', 'maptalks-zoom-slider-reading');
        //     const dot = createEl('span', 'maptalks-zoom-slider-dot');
        //     ruler.appendChild(reading);
        //     box.appendChild(ruler);
        //     box.appendChild(dot);
        //     zoomDOM.appendChild(box);
        //     this._sliderBox = box;
        //     this._sliderRuler = ruler;
        //     this._sliderReading = reading;
        //     this._sliderDot = dot;
        // }

        const zoomOutButton = createEl('a', 'maptalks-zoom-zoomout');
        zoomOutButton.href = 'javascript:;';
        zoomDOM.appendChild(zoomOutButton);
        this._zoomOutButton = zoomOutButton;

        dom.appendChild(zoomDOM);

        map.on('_zoomend _zooming _zoomstart _spatialreferencechange', this._update, this);

        this._update();
        this._registerDomEvents();

        return dom;
    }

    onRemove() {
        this.getMap().off('_zoomend _zooming _zoomstart _spatialreferencechange', this._update, this);
        // if (this._zoomInButton) {
        //     off(this._zoomInButton, 'click', this._onZoomInClick, this);
        // }
        // if (this._zoomOutButton) {
        //     off(this._zoomOutButton, 'click', this._onZoomOutClick, this);
        // }
        // if (this._sliderRuler) {
        //     off(this._sliderRuler, 'click', this._onClickRuler, this);
        //     this.dotDragger.disable();
        //     delete this.dotDragger;
        // }
    }

    _update() {
        // const map = this.getMap();
        // if (this._sliderBox) {
        //     const totalRange = (map.getMaxZoom() - map.getMinZoom()) * UNIT;
        //     this._sliderBox.style.height = totalRange + 16 + 'px';
        //     this._sliderRuler.style.height = totalRange + 8 + 'px';
        //     this._sliderRuler.style.cursor = 'pointer';
        //     const zoomRange = (map.getMaxZoom() - map.getZoom()) * UNIT;
        //     //this._sliderReading.style.height = (map.getZoom() - map.getMinZoom()) * UNIT + 'px';
        //     this._sliderReading.style.height = (map.getZoom() - map.getMinZoom() + 1) * UNIT + 'px';
        //     this._sliderDot.style.top = zoomRange + 'px';
        // }
        this._updateText();
    }

    _updateText() {
        if (this._levelDOM) {
            const map = this.getMap();
            let zoom = map.getZoom();
            if (!isInteger(zoom)) {
                zoom = Math.floor(zoom * 10) / 10;
            }
            this._levelDOM.innerHTML = zoom;
        }
    }

    _registerDomEvents() {
        if (this._zoomInButton) {
            on(this._zoomInButton, 'click', this._onZoomInClick, this);
        }
        if (this._zoomOutButton) {
            on(this._zoomOutButton, 'click', this._onZoomOutClick, this);
        }
        // if (this._sliderRuler) {
        //     on(this._sliderRuler, 'click', this._onClickRuler, this);
        //     this.dotDragger = new DragHandler(this._sliderDot, {
        //         'ignoreMouseleave' : true
        //     });
        //     this.dotDragger.on('dragstart', this._onDotDragstart, this)
        //         .on('dragging dragend', this._onDotDrag, this)
        //         .enable();
        // }
    }

    _onZoomInClick(e) {
        preventDefault(e);
        this.getMap().zoomIn();
    }

    _onZoomOutClick(e) {
        preventDefault(e);
        this.getMap().zoomOut();
    }

    // _onClickRuler(e) {
    //     preventDefault(e);
    //     const map = this.getMap(),
    //         point = getEventContainerPoint(e, this._sliderRuler),
    //         h = point.y;
    //     const maxZoom = map.getMaxZoom(),
    //         zoom = Math.floor(maxZoom - h / UNIT);
    //     map.setZoom(zoom);
    // }

    // _onDotDragstart(e) {
    //     preventDefault(e.domEvent);
    //     const map = this.getMap(),
    //         origin = map.getSize().toPoint()._multi(1 / 2);
    //     map.onZoomStart(map.getZoom(), origin);
    // }

    // _onDotDrag(e) {
    //     preventDefault(e.domEvent);
    //     const map = this.getMap(),
    //         origin = map.getSize().toPoint()._multi(1 / 2),
    //         point = getEventContainerPoint(e.domEvent, this._sliderRuler),
    //         maxZoom = map.getMaxZoom(),
    //         minZoom = map.getMinZoom();
    //     let top = point.y,
    //         z = maxZoom - top / UNIT;

    //     if (maxZoom < z) {
    //         z = maxZoom;
    //         top = 0;
    //     } else if (minZoom > z) {
    //         z = minZoom;
    //         top = (maxZoom - minZoom) * UNIT;
    //     }

    //     if (e.type === 'dragging') {
    //         map.onZooming(z, origin, 1);
    //     } else if (e.type === 'dragend') {
    //         if (this.options['seamless']) {
    //             map.onZoomEnd(z, origin);
    //         } else {
    //             map.onZoomEnd(Math.round(z), origin);
    //         }
    //     }
    //     // this._sliderDot.style.top = top + 'px';
    //     //this._sliderReading.style.height = (map.getZoom() - minZoom) * UNIT + 'px';
    //     // this._sliderReading.style.height = (map.getZoom() - minZoom + 1) * UNIT + 'px';
    //     this._updateText();
    // }
}
