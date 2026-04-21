constructor(id, options) {
    super(id, options);
    if (!this.options.hasOwnProperty('forceRenderOnMoving')) {
        // force not to forceRenderOnMoving
        this.options['forceRenderOnMoving'] = false;
    }
}
