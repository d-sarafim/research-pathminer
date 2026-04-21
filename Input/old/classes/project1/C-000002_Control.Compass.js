class Compass extends Control {
    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn(map) {
        const compass = this._getCompass();
        this._compass = compass;

        this._registerDomEvents();

        map.on('resize moving moveend zooming zoomend rotate rotateend dragrotating dragrotateend viewchange', this._rotateCompass, this);

        return compass;
    }

    onAdd() {
        this._rotateCompass();
    }

    _getCompass() {
        const compass = createEl('div', 'maptalks-compass');
        return compass;
    }

    _registerDomEvents() {
        on(this._compass, 'click', this._resetView, this);
    }

    _rotateCompass() {
        let bearing = this.getMap().getBearing().toFixed(1);
        if (bearing <= 180) bearing *= -1;
        if (bearing !== this._bearing) {
            this._bearing = bearing;
            setStyle(
                this._compass,
                `transform: rotate(${this._bearing}deg);`,
            );
        }
    }

    onRemove() {
        this.getMap().off('resize moving moveend zooming zoomend rotate rotateend dragrotating dragrotateend viewchange', this._rotateCompass, this);
        delete this._compass;
        delete this._bearing;
    }

    _resetView() {
        const view = { bearing: 0 };
        this.getMap().animateTo(view);
    }
}
