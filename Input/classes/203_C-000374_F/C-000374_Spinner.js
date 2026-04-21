class Spinner extends Component {

    /**
     @private
     */
    get type() {
        return "Spinner";
    }

    /**
     @private
     */
    constructor(owner, cfg = {}) {

        super(owner, cfg);

        this._canvas = cfg.canvas;
        this._element = null;
        this._isCustom = false; // True when the element is custom HTML

        if (cfg.elementId) { // Custom spinner element supplied
            this._element = document.getElementById(cfg.elementId);
            if (!this._element) {
                this.error("Can't find given Spinner HTML element: '" + cfg.elementId + "' - will automatically create default element");
            } else {
                this._adjustPosition();
            }
        }

        if (!this._element) {
            this._createDefaultSpinner();
        }

        this.processes = 0;
    }

    /** @private */
    _createDefaultSpinner() {
        this._injectDefaultCSS();
        const element = document.createElement('div');
        const style = element.style;
        style["z-index"] = "9000";
        style.position = "absolute";
        element.innerHTML = '<div class="sk-fading-circle">\
                <div class="sk-circle1 sk-circle"></div>\
                <div class="sk-circle2 sk-circle"></div>\
                <div class="sk-circle3 sk-circle"></div>\
                <div class="sk-circle4 sk-circle"></div>\
                <div class="sk-circle5 sk-circle"></div>\
                <div class="sk-circle6 sk-circle"></div>\
                <div class="sk-circle7 sk-circle"></div>\
                <div class="sk-circle8 sk-circle"></div>\
                <div class="sk-circle9 sk-circle"></div>\
                <div class="sk-circle10 sk-circle"></div>\
                <div class="sk-circle11 sk-circle"></div>\
                <div class="sk-circle12 sk-circle"></div>\
                </div>';
        this._canvas.parentElement.appendChild(element);
        this._element = element;
        this._isCustom = false;
        this._adjustPosition();
    }

    /**
     * @private
     */
    _injectDefaultCSS() {
        const elementId = "xeokit-spinner-css";
        if (document.getElementById(elementId)) {
            return;
        }
        const defaultCSSNode = document.createElement('style');
        defaultCSSNode.innerHTML = defaultCSS;
        defaultCSSNode.id = elementId;
        document.body.appendChild(defaultCSSNode);
    }

    /**
     * @private
     */
    _adjustPosition() { // (Re)positions spinner DIV over the center of the canvas - called by Canvas
        if (this._isCustom) {
            return;
        }
        const canvas = this._canvas;
        const element = this._element;
        const style = element.style;
        style["left"] = (canvas.offsetLeft + (canvas.clientWidth * 0.5) - (element.clientWidth * 0.5)) + "px";
        style["top"] = (canvas.offsetTop + (canvas.clientHeight * 0.5) - (element.clientHeight * 0.5)) + "px";
    }

    /**
     * Sets the number of processes this Spinner represents.
     *
     * The Spinner is visible while this property is greater than zero.
     *
     * Increment this property whenever you commence some process during which you want the Spinner to be visible, then decrement it again when the process is complete.
     *
     * Clamps to zero if you attempt to set to to a negative value.
     *
     * Fires a {@link Spinner#processes:event} event on change.

     * Default value is ````0````.
     *
     * @param {Number} value New processes count.
     */
    set processes(value) {
        value = value || 0;
        if (this._processes === value) {
            return;
        }
        if (value < 0) {
            return;
        }
        const prevValue = this._processes;
        this._processes = value;
        const element = this._element;
        if (element) {
            element.style["visibility"] = (this._processes > 0) ? "visible" : "hidden";
        }
        /**
         Fired whenever this Spinner's {@link Spinner#visible} property changes.

         @event processes
         @param value The property's new value
         */
        this.fire("processes", this._processes);
        if (this._processes === 0 && this._processes !== prevValue) {
            /**
             Fired whenever this Spinner's {@link Spinner#visible} property becomes zero.

             @event zeroProcesses
             */
            this.fire("zeroProcesses", this._processes);
        }
    }

    /**
     * Gets the number of processes this Spinner represents.
     *
     * The Spinner is visible while this property is greater than zero.
     *
     * @returns {Number} Current processes count.
     */
    get processes() {
        return this._processes;
    }

    _destroy() {
        if (this._element && (!this._isCustom)) {
            this._element.parentNode.removeChild(this._element);
            this._element = null;
        }
        const styleElement = document.getElementById("xeokit-spinner-css");
        if (styleElement) {
            styleElement.parentNode.removeChild(styleElement)
        }
    }
}
