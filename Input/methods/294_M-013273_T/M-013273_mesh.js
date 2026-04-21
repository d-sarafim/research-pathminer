_initBoneAabbs(morphTargets) {

    this.boneAabb = [];
    this.boneUsed = [];
    let x, y, z;
    let bMax, bMin;
    const boneMin = [];
    const boneMax = [];
    const boneUsed = this.boneUsed;
    const numBones = this.skin.boneNames.length;
    let maxMorphX, maxMorphY, maxMorphZ;

    // start with empty bone bounds
    for (let i = 0; i < numBones; i++) {
        boneMin[i] = new Vec3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        boneMax[i] = new Vec3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    }

    // access to mesh from vertex buffer
    const iterator = new VertexIterator(this.vertexBuffer);
    const posElement = iterator.element[SEMANTIC_POSITION];
    const weightsElement = iterator.element[SEMANTIC_BLENDWEIGHT];
    const indicesElement = iterator.element[SEMANTIC_BLENDINDICES];

    // Find bone AABBs of attached vertices
    const numVerts = this.vertexBuffer.numVertices;
    for (let j = 0; j < numVerts; j++) {
        for (let k = 0; k < 4; k++) {
            const boneWeight = weightsElement.array[weightsElement.index + k];
            if (boneWeight > 0) {
                const boneIndex = indicesElement.array[indicesElement.index + k];
                boneUsed[boneIndex] = true;

                x = posElement.array[posElement.index];
                y = posElement.array[posElement.index + 1];
                z = posElement.array[posElement.index + 2];

                // adjust bounds of a bone by the vertex
                bMax = boneMax[boneIndex];
                bMin = boneMin[boneIndex];

                if (bMin.x > x) bMin.x = x;
                if (bMin.y > y) bMin.y = y;
                if (bMin.z > z) bMin.z = z;

                if (bMax.x < x) bMax.x = x;
                if (bMax.y < y) bMax.y = y;
                if (bMax.z < z) bMax.z = z;

                if (morphTargets) {

                    // find maximum displacement of the vertex by all targets
                    let minMorphX = maxMorphX = x;
                    let minMorphY = maxMorphY = y;
                    let minMorphZ = maxMorphZ = z;

                    // morph this vertex by all morph targets
                    for (let l = 0; l < morphTargets.length; l++) {
                        const target = morphTargets[l];

                        const dx = target.deltaPositions[j * 3];
                        const dy = target.deltaPositions[j * 3 + 1];
                        const dz = target.deltaPositions[j * 3 + 2];

                        if (dx < 0) {
                            minMorphX += dx;
                        } else {
                            maxMorphX += dx;
                        }

                        if (dy < 0) {
                            minMorphY += dy;
                        } else {
                            maxMorphY += dy;
                        }

                        if (dz < 0) {
                            minMorphZ += dz;
                        } else {
                            maxMorphZ += dz;
                        }
                    }

                    if (bMin.x > minMorphX) bMin.x = minMorphX;
                    if (bMin.y > minMorphY) bMin.y = minMorphY;
                    if (bMin.z > minMorphZ) bMin.z = minMorphZ;

                    if (bMax.x < maxMorphX) bMax.x = maxMorphX;
                    if (bMax.y < maxMorphY) bMax.y = maxMorphY;
                    if (bMax.z < maxMorphZ) bMax.z = maxMorphZ;
                }
            }
        }
        iterator.next();
    }

    // account for normalized positional data
    const positionElement = this.vertexBuffer.getFormat().elements.find(e => e.name === SEMANTIC_POSITION);
    if (positionElement && positionElement.normalize) {
        const func = (() => {
            switch (positionElement.dataType) {
                case TYPE_INT8: return x => Math.max(x / 127.0, -1.0);
                case TYPE_UINT8: return x => x / 255.0;
                case TYPE_INT16: return x => Math.max(x / 32767.0, -1.0);
                case TYPE_UINT16: return x => x / 65535.0;
                default: return x => x;
            }
        })();

        for (let i = 0; i < numBones; i++) {
            if (boneUsed[i]) {
                const min = boneMin[i];
                const max = boneMax[i];
                min.set(func(min.x), func(min.y), func(min.z));
                max.set(func(max.x), func(max.y), func(max.z));
            }
        }
    }

    // store bone bounding boxes
    for (let i = 0; i < numBones; i++) {
        const aabb = new BoundingBox();
        aabb.setMinMax(boneMin[i], boneMax[i]);
        this.boneAabb.push(aabb);
    }
}
