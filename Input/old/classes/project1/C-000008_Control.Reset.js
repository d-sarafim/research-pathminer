class Reset extends Control {
    /**
     * method to build DOM of the control
     * @param  {Map} map map to build on
     * @return {HTMLDOMElement}
     */
    buildOn() {
        const reset = this._getReset();
        this._reset = reset;

        this._registerDomEvents();

        return reset;
    }

    onAdd() {
        this._view = !this.options.view ? this.getMap().getView() : this.options.view;
    }

    setView(view) {
        this._view = view;
    }

    _getReset() {
        const reset = createEl('div', 'maptalks-reset');
        return reset;
    }

    _registerDomEvents() {
        on(this._reset, 'click', this._resetView, this);
    }

    onRemove() {
        delete this._reset;
        delete this._view;
    }

    _resetView() {
        this.getMap().setView(this._view);
    }
}
