class Viewport extends Component {

    /**
     @private
     */
    get type() {
        return "Viewport";
    }

    /**
     @private
     */
    constructor(owner, cfg = {}) {

        super(owner, cfg);

        this._state = new RenderState({
            boundary: [0, 0, 100, 100]
        });

        this.boundary = cfg.boundary;
        this.autoBoundary = cfg.autoBoundary;
    }


    /**
     * Sets the canvas-space boundary of this Viewport, indicated as ````[min, max, width, height]````.
     *
     * When {@link Viewport#autoBoundary} is ````true````, ignores calls to this method and automatically synchronizes with {@link Canvas#boundary}.
     *
     * Fires a "boundary"" event on change.
     *
     * Defaults to the {@link Canvas} extents.
     *
     * @param {Number[]} value New Viewport extents.
     */
    set boundary(value) {

        if (this._autoBoundary) {
            return;
        }

        if (!value) {

            const canvasBoundary = this.scene.canvas.boundary;

            const width = canvasBoundary[2];
            const height = canvasBoundary[3];

            value = [0, 0, width, height];
        }

        this._state.boundary = value;

        this.glRedraw();

        /**
         Fired whenever this Viewport's {@link Viewport#boundary} property changes.

         @event boundary
         @param value {Boolean} The property's new value
         */
        this.fire("boundary", this._state.boundary);
    }

    /**
     * Gets the canvas-space boundary of this Viewport, indicated as ````[min, max, width, height]````.
     *
     * @returns {Number[]} The Viewport extents.
     */
    get boundary() {
        return this._state.boundary;
    }

    /**
     * Sets if {@link Viewport#boundary} automatically synchronizes with {@link Canvas#boundary}.
     *
     * Default is ````false````.
     *
     * @param {Boolean} value Set true to automatically sycnhronize.
     */
    set autoBoundary(value) {

        value = !!value;

        if (value === this._autoBoundary) {
            return;
        }

        this._autoBoundary = value;

        if (this._autoBoundary) {
            this._onCanvasSize = this.scene.canvas.on("boundary",
                function (boundary) {

                    const width = boundary[2];
                    const height = boundary[3];

                    this._state.boundary = [0, 0, width, height];

                    this.glRedraw();

                    /**
                     Fired whenever this Viewport's {@link Viewport#boundary} property changes.

                     @event boundary
                     @param value {Boolean} The property's new value
                     */
                    this.fire("boundary", this._state.boundary);

                }, this);

        } else if (this._onCanvasSize) {
            this.scene.canvas.off(this._onCanvasSize);
            this._onCanvasSize = null;
        }

        /**
         Fired whenever this Viewport's {@link autoBoundary/autoBoundary} property changes.

         @event autoBoundary
         @param value The property's new value
         */
        this.fire("autoBoundary", this._autoBoundary);
    }

    /**
     * Gets if {@link Viewport#boundary} automatically synchronizes with {@link Canvas#boundary}.
     *
     * Default is ````false````.
     *
     * @returns {Boolean} Returns ````true```` when automatically sycnhronizing.
     */
    get autoBoundary() {
        return this._autoBoundary;
    }

    _getState() {
        return this._state;
    }

    /**
     * @private
     */
    destroy() {
        super.destroy();
        this._state.destroy();
    }
}
