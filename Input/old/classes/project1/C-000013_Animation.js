class Player {

    /**
     * Create an animation player
     * @param {Function} animation - animation [framing]{@link framing} function
     * @param {Object} options     - animation options
     * @param {Function} onFrame  - callback function for animation steps
     */
    constructor(animation, options, onFrame, target) {
        this._animation = animation;
        this.options = options;
        this._onFrame = onFrame;
        this.playState = 'idle';
        this.ready = true;
        this.finished = false;
        this.target = target;
    }
}
