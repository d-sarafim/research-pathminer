_subPortionSetOffset(subPortionId, offset) {
    if (!this._finalized) {
        throw "Not finalized";
    }
    // if (!this.model.scene.entityOffsetsEnabled) {
    //     this.model.error("Entity#offset not enabled for this Viewer"); // See Viewer entityOffsetsEnabled
    //     return;
    // }
    const textureState = this._dataTextureState;
    const gl = this.model.scene.canvas.gl;
    tempFloat32Array3 [0] = offset[0];
    tempFloat32Array3 [1] = offset[1];
    tempFloat32Array3 [2] = offset[2];
    // object offset
    textureState.texturePerObjectIdOffsets._textureData.set(tempFloat32Array3, subPortionId * 3);
    if (this._deferredSetFlagsActive) {
        this._deferredSetFlagsDirty = true;
        return;
    }
    if (++this._numUpdatesInFrame >= MAX_OBJECT_UPDATES_IN_FRAME_WITHOUT_BATCHED_UPDATE) {
        this._beginDeferredFlags(); // Subsequent flags updates now deferred
    }
    gl.bindTexture(gl.TEXTURE_2D, textureState.texturePerObjectIdOffsets._texture);
    gl.texSubImage2D(
        gl.TEXTURE_2D,
        0, // level
        0, // x offset
        subPortionId, // yoffset
        1, // width
        1, // height
        gl.RGB,
        gl.FLOAT,
        tempFloat32Array3
    );
    // gl.bindTexture (gl.TEXTURE_2D, null);
}
