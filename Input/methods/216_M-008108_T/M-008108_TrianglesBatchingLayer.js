finalize() {

    if (this._finalized) {
        return;
    }

    const state = this._state;
    const gl = this.model.scene.canvas.gl;
    const buffer = this._buffer;

    if (buffer.positions.length > 0) {
        const quantizedPositions = (this._state.positionsDecodeMatrix)
            ? new Uint16Array(buffer.positions)
            : quantizePositions(buffer.positions, this._modelAABB, this._state.positionsDecodeMatrix = math.mat4()); // BOTTLENECK
        state.positionsBuf = new ArrayBuf(gl, gl.ARRAY_BUFFER, quantizedPositions, quantizedPositions.length, 3, gl.STATIC_DRAW);
        if (this.model.scene.pickSurfacePrecisionEnabled) {
            for (let i = 0, numPortions = this._portions.length; i < numPortions; i++) {
                const portion = this._portions[i];
                const start = portion.vertsBaseIndex * 3;
                const end = start + (portion.numVerts * 3);
                portion.quantizedPositions = quantizedPositions.slice(start, end);
            }
        }
    }

    if (buffer.normals.length > 0) { // Normals are already oct-encoded
        const normals = new Int8Array(buffer.normals);
        let normalized = true; // For oct encoded UInts
        state.normalsBuf = new ArrayBuf(gl, gl.ARRAY_BUFFER, normals, buffer.normals.length, 3, gl.STATIC_DRAW, normalized);
    }

    if (buffer.colors.length > 0) { // Colors are already compressed
        const colors = new Uint8Array(buffer.colors);
        let normalized = false;
        state.colorsBuf = new ArrayBuf(gl, gl.ARRAY_BUFFER, colors, buffer.colors.length, 4, gl.DYNAMIC_DRAW, normalized);
    }

    if (buffer.uv.length > 0) {
        if (!state.uvDecodeMatrix) {
            const bounds = geometryCompressionUtils.getUVBounds(buffer.uv);
            const result = geometryCompressionUtils.compressUVs(buffer.uv, bounds.min, bounds.max);
            const uv = result.quantized;
            let notNormalized = false;
            state.uvDecodeMatrix = math.mat3(result.decodeMatrix);
            state.uvBuf = new ArrayBuf(gl, gl.ARRAY_BUFFER, uv, uv.length, 2, gl.STATIC_DRAW, notNormalized);
        } else {
            let notNormalized = false;
            state.uvBuf = new ArrayBuf(gl, gl.ARRAY_BUFFER, buffer.uv, buffer.uv.length, 2, gl.STATIC_DRAW, notNormalized);
        }
    }

    if (buffer.metallicRoughness.length > 0) {
        const metallicRoughness = new Uint8Array(buffer.metallicRoughness);
        let normalized = false;
        state.metallicRoughnessBuf = new ArrayBuf(gl, gl.ARRAY_BUFFER, metallicRoughness, buffer.metallicRoughness.length, 2, gl.STATIC_DRAW, normalized);
    }

    if (buffer.positions.length > 0) { // Because we build flags arrays here, get their length from the positions array
        const flagsLength = (buffer.positions.length / 3);
        const flags = new Float32Array(flagsLength);
        const notNormalized = false;
        state.flagsBuf = new ArrayBuf(gl, gl.ARRAY_BUFFER, flags, flags.length, 1, gl.DYNAMIC_DRAW, notNormalized);
    }

    if (buffer.pickColors.length > 0) {
        const pickColors = new Uint8Array(buffer.pickColors);
        let normalized = false;
        state.pickColorsBuf = new ArrayBuf(gl, gl.ARRAY_BUFFER, pickColors, buffer.pickColors.length, 4, gl.STATIC_DRAW, normalized);
    }

    if (this.model.scene.entityOffsetsEnabled) {
        if (buffer.offsets.length > 0) {
            const offsets = new Float32Array(buffer.offsets);
            state.offsetsBuf = new ArrayBuf(gl, gl.ARRAY_BUFFER, offsets, buffer.offsets.length, 3, gl.DYNAMIC_DRAW);
        }
    }

    if (buffer.indices.length > 0) {
        const indices = new Uint32Array(buffer.indices);
        state.indicesBuf = new ArrayBuf(gl, gl.ELEMENT_ARRAY_BUFFER, indices, buffer.indices.length, 1, gl.STATIC_DRAW);
    }
    if (buffer.edgeIndices.length > 0) {
        const edgeIndices = new Uint32Array(buffer.edgeIndices);
        state.edgeIndicesBuf = new ArrayBuf(gl, gl.ELEMENT_ARRAY_BUFFER, edgeIndices, buffer.edgeIndices.length, 1, gl.STATIC_DRAW);
    }

    this._state.pbrSupported
        = !!state.metallicRoughnessBuf
        && !!state.uvBuf
        && !!state.normalsBuf
        && !!state.textureSet
        && !!state.textureSet.colorTexture
        && !!state.textureSet.metallicRoughnessTexture;

    this._state.colorTextureSupported
        = !!state.uvBuf
        && !!state.textureSet
        && !!state.textureSet.colorTexture;

    this._buffer = null;
    this._finalized = true;
}
