class Material extends Component {

    /**
     @private
     */
    get type() {
        return "Material";
    }

    constructor(owner, cfg={}) {
        super(owner, cfg);
        stats.memory.materials++;
    }

    destroy() {
        super.destroy();
        stats.memory.materials--;
    }
}
