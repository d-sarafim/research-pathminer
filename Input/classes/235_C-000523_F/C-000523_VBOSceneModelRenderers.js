class VBOSceneModelPointBatchingRenderer extends VBOSceneModelRenderer {
    _draw(drawCfg) {
        const {gl} = this._scene.canvas;

        const {
            state,
            frameCtx,
            incrementDrawState,
        } = drawCfg;

        gl.drawArrays(gl.POINTS, 0, state.positionsBuf.numItems);

        if (incrementDrawState) {
            frameCtx.drawArrays++;
        }
    }
}
