createPortion(cfg) {

    if (this._finalized) {
        throw "Already finalized";
    }

    const positions = cfg.positions;
    const positionsCompressed = cfg.positionsCompressed;
    const normals = cfg.normals;
    const normalsCompressed = cfg.normalsCompressed;
    const uv = cfg.uv;
    const uvCompressed = cfg.uvCompressed;
    const colors = cfg.colors;
    const colorsCompressed = cfg.colorsCompressed;
    const indices = cfg.indices;
    const edgeIndices = cfg.edgeIndices;
    const color = cfg.color;
    const metallic = cfg.metallic;
    const roughness = cfg.roughness;
    const opacity = cfg.opacity;
    const meshMatrix = cfg.meshMatrix;
    const sceneModelMatrix = cfg.sceneModelMatrix;
    const worldAABB = cfg.worldAABB;
    const pickColor = cfg.pickColor;

    const scene = this.model.scene;
    const buffer = this._buffer;
    const vertsBaseIndex = buffer.positions.length / 3;

    let numVerts;


    if (this._state.positionsDecodeMatrix) {

        if (!positionsCompressed) {
            throw "positionsCompressed expected";
        }

        numVerts = positionsCompressed.length / 3;

        for (let i = 0, len = positionsCompressed.length; i < len; i++) {
            buffer.positions.push(positionsCompressed[i]);
        }

        const bounds = geometryCompressionUtils.getPositionsBounds(positionsCompressed);

        const min = geometryCompressionUtils.decompressPosition(bounds.min, this._state.positionsDecodeMatrix, []);
        const max = geometryCompressionUtils.decompressPosition(bounds.max, this._state.positionsDecodeMatrix, []);

        worldAABB[0] = min[0];
        worldAABB[1] = min[1];
        worldAABB[2] = min[2];
        worldAABB[3] = max[0];
        worldAABB[4] = max[1];
        worldAABB[5] = max[2];

        if (sceneModelMatrix) {
            math.AABB3ToOBB3(worldAABB, tempOBB3);
            math.transformOBB3(sceneModelMatrix, tempOBB3);
            math.OBB3ToAABB3(tempOBB3, worldAABB);
        }

    } else {

        if (!positions) {
            throw "positions expected";
        }

        numVerts = positions.length / 3;

        const lenPositions = positions.length;

        const positionsBase = buffer.positions.length;

        for (let i = 0, len = positions.length; i < len; i++) {
            buffer.positions.push(positions[i]);
        }

        if (meshMatrix) {

            for (let i = positionsBase, len = positionsBase + lenPositions; i < len; i += 3) {

                tempVec4a[0] = buffer.positions[i + 0];
                tempVec4a[1] = buffer.positions[i + 1];
                tempVec4a[2] = buffer.positions[i + 2];

                math.transformPoint4(meshMatrix, tempVec4a, tempVec4b);

                buffer.positions[i + 0] = tempVec4b[0];
                buffer.positions[i + 1] = tempVec4b[1];
                buffer.positions[i + 2] = tempVec4b[2];

                math.expandAABB3Point3(this._modelAABB, tempVec4b);

                if (sceneModelMatrix) {
                    math.transformPoint4(sceneModelMatrix, tempVec4b, tempVec4c);
                    math.expandAABB3Point3(worldAABB, tempVec4c);
                } else {
                    math.expandAABB3Point3(worldAABB, tempVec4b);
                }
            }

        } else {

            for (let i = positionsBase, len = positionsBase + lenPositions; i < len; i += 3) {

                tempVec4a[0] = buffer.positions[i + 0];
                tempVec4a[1] = buffer.positions[i + 1];
                tempVec4a[2] = buffer.positions[i + 2];

                math.expandAABB3Point3(this._modelAABB, tempVec4a);

                if (sceneModelMatrix) {
                    math.transformPoint4(sceneModelMatrix, tempVec4a, tempVec4b);
                    math.expandAABB3Point3(worldAABB, tempVec4b);
                } else {
                    math.expandAABB3Point3(worldAABB, tempVec4a);
                }
            }
        }
    }

    if (this._state.origin) {
        const origin = this._state.origin;
        worldAABB[0] += origin[0];
        worldAABB[1] += origin[1];
        worldAABB[2] += origin[2];
        worldAABB[3] += origin[0];
        worldAABB[4] += origin[1];
        worldAABB[5] += origin[2];
    }

    math.expandAABB3(this.aabb, worldAABB);

    if (normalsCompressed && normalsCompressed.length > 0) {
        for (let i = 0, len = normalsCompressed.length; i < len; i++) {
            buffer.normals.push(normalsCompressed[i]);
        }
    } else if (normals && normals.length > 0) {
        const worldNormalMatrix = tempMat4;
        if (meshMatrix) {
            math.inverseMat4(math.transposeMat4(meshMatrix, tempMat4b), worldNormalMatrix); // Note: order of inverse and transpose doesn't matter
        } else {
            math.identityMat4(worldNormalMatrix, worldNormalMatrix);
        }
        transformAndOctEncodeNormals(worldNormalMatrix, normals, normals.length, buffer.normals, buffer.normals.length);
    }

    if (colors) {
        for (let i = 0, len = colors.length; i < len; i += 3) {
            buffer.colors.push(colors[i] * 255);
            buffer.colors.push(colors[i + 1] * 255);
            buffer.colors.push(colors[i + 2] * 255);
            buffer.colors.push(255);
        }
    } else if (colorsCompressed) {
        for (let i = 0, len = colors.length; i < len; i += 3) {
            buffer.colors.push(colors[i]);
            buffer.colors.push(colors[i + 1]);
            buffer.colors.push(colors[i + 2]);
            buffer.colors.push(255);
        }
    } else if (color) {
        const r = color[0]; // Color is pre-quantized by VBOSceneModel
        const g = color[1];
        const b = color[2];
        const a = opacity;
        for (let i = 0; i < numVerts; i++) {
            buffer.colors.push(r);
            buffer.colors.push(g);
            buffer.colors.push(b);
            buffer.colors.push(a);
        }
    }
    const metallicValue = (metallic !== null && metallic !== undefined) ? metallic : 0;
    const roughnessValue = (roughness !== null && roughness !== undefined) ? roughness : 255;
    for (let i = 0; i < numVerts; i++) {
        buffer.metallicRoughness.push(metallicValue);
        buffer.metallicRoughness.push(roughnessValue);
    }

    if (uv && uv.length > 0) {
        for (let i = 0, len = uv.length; i < len; i++) {
            buffer.uv.push(uv[i]);
        }
    } else if (uvCompressed && uvCompressed.length > 0) {
        for (let i = 0, len = uvCompressed.length; i < len; i++) {
            buffer.uv.push(uvCompressed[i]);
        }
    }

    for (let i = 0, len = indices.length; i < len; i++) {
        buffer.indices.push(vertsBaseIndex + indices[i]);
    }


    if (edgeIndices) {
        for (let i = 0, len = edgeIndices.length; i < len; i++) {
            buffer.edgeIndices.push(vertsBaseIndex + edgeIndices[i]);
        }
    }

    {
        const pickColorsBase = buffer.pickColors.length;
        const lenPickColors = numVerts * 4;
        for (let i = pickColorsBase, len = pickColorsBase + lenPickColors; i < len; i += 4) {
            buffer.pickColors.push(pickColor[0]);
            buffer.pickColors.push(pickColor[1]);
            buffer.pickColors.push(pickColor[2]);
            buffer.pickColors.push(pickColor[3]);
        }
    }

    if (scene.entityOffsetsEnabled) {
        for (let i = 0; i < numVerts; i++) {
            buffer.offsets.push(0);
            buffer.offsets.push(0);
            buffer.offsets.push(0);
        }
    }

    const portionId = this._portions.length;

    const portion = {
        vertsBaseIndex: vertsBaseIndex,
        numVerts: numVerts,
        indicesBaseIndex: buffer.indices.length - indices.length,
        numIndices: indices.length,
    };

    if (scene.pickSurfacePrecisionEnabled) {
        // Quantized in-memory positions are initialized in finalize()

        portion.indices = indices;

        if (scene.entityOffsetsEnabled) {
            portion.offset = new Float32Array(3);
        }
    }

    this._portions.push(portion);

    this._numPortions++;

    this.model.numPortions++;

    this._numVerts += portion.numVerts;

    return portionId;
}
