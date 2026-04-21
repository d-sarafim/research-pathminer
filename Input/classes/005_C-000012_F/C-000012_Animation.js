class Frame {
    /**
     * Create an animation frame.
     * @param {Object} state  - animation state
     * @param {Object} styles - styles to animate
     */
    constructor(state, styles) {
        this.state = state;
        this.styles = styles;
    }

    get playState() {
        return this.state.playState;
    }

    get symbol() {
        return this.styles.symbol;
    }
}
