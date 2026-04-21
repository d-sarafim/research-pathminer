class Light extends Component {

    /**
     @private
     */
    get type() {
        return "Light";
    }

    /**
     * @private
     */
    get isLight() {
        return true;
    }

    constructor(owner, cfg = {}) {
        super(owner, cfg);
    }
}
