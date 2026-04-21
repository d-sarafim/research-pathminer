setOffset(portionId, offset) {
    if (!this._finalized) {
        throw "Not finalized";
    }
    if (!this.model.scene.entityOffsetsEnabled) {
        this.model.error("Entity#offset not enabled for this Viewer"); // See Viewer entityOffsetsEnabled
        return;
    }
    const portionsIdx = portionId;
    const portion = this._portions[portionsIdx];
    const vertsBaseIndex = portion.vertsBaseIndex;
    const numVerts = portion.numVerts;
    const firstOffset = vertsBaseIndex * 3;
    const lenOffsets = numVerts * 3;
    const tempArray = this._scratchMemory.getFloat32Array(lenOffsets);
    const x = offset[0];
    const y = offset[1];
    const z = offset[2];
    for (let i = 0; i < lenOffsets; i += 3) {
        tempArray[i + 0] = x;
        tempArray[i + 1] = y;
        tempArray[i + 2] = z;
    }
    if (this._state.offsetsBuf) {
        this._state.offsetsBuf.setData(tempArray, firstOffset, lenOffsets);
    }
    if (this.model.scene.pickSurfacePrecisionEnabled) {
        portion.offset[0] = offset[0];
        portion.offset[1] = offset[1];
        portion.offset[2] = offset[2];
    }
}
