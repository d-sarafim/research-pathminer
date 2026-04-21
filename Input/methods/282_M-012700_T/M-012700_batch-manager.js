create(meshInstances, dynamic, batchGroupId) {

    // #if _PROFILER
    const time = now();
    // #endif

    if (!this._init) {
        const boneLimit = '#define BONE_LIMIT ' + this.device.getBoneLimit() + '\n';
        this.transformVS = boneLimit + '#define DYNAMICBATCH\n' + shaderChunks.transformVS;
        this.skinTexVS = shaderChunks.skinBatchTexVS;
        this.skinConstVS = shaderChunks.skinBatchConstVS;
        this.vertexFormats = {};
        this._init = true;
    }

    let stream = null;
    let semantic;
    let mesh, numVerts;
    let batch = null;

    // find out vertex streams and counts
    const batchData = this.collectBatchedMeshData(meshInstances, dynamic);

    // if anything to batch
    if (batchData.streams) {

        const streams = batchData.streams;
        let material = batchData.material;
        const batchNumVerts = batchData.batchNumVerts;
        const batchNumIndices = batchData.batchNumIndices;

        batch = new Batch(meshInstances, dynamic, batchGroupId);
        this._batchList.push(batch);

        let indexBase, numIndices, indexData;
        let verticesOffset = 0;
        let indexOffset = 0;
        let transform;
        const vec = new Vec3();

        // allocate indices
        const indexArrayType = batchNumVerts <= 0xffff ? Uint16Array : Uint32Array;
        const indices = new indexArrayType(batchNumIndices);

        // allocate typed arrays to store final vertex stream data
        for (semantic in streams) {
            stream = streams[semantic];
            stream.typeArrayType = typedArrayTypes[stream.dataType];
            stream.elementByteSize = typedArrayTypesByteSize[stream.dataType];
            stream.buffer = new stream.typeArrayType(batchNumVerts * stream.numComponents);
        }

        // build vertex and index data for final mesh
        for (let i = 0; i < meshInstances.length; i++) {
            if (!meshInstances[i].visible)
                continue;

            mesh = meshInstances[i].mesh;
            numVerts = mesh.vertexBuffer.numVertices;

            // matrix to transform vertices to world space for static batching
            if (!dynamic) {
                transform = meshInstances[i].node.getWorldTransform();
            }

            for (semantic in streams) {
                if (semantic !== SEMANTIC_BLENDINDICES) {
                    stream = streams[semantic];

                    // get vertex stream to typed view subarray
                    const subarray = new stream.typeArrayType(stream.buffer.buffer, stream.elementByteSize * stream.count);
                    const totalComponents = mesh.getVertexStream(semantic, subarray) * stream.numComponents;
                    stream.count += totalComponents;

                    // transform position, normal and tangent to world space
                    if (!dynamic && stream.numComponents >= 3) {
                        if (semantic === SEMANTIC_POSITION) {
                            for (let j = 0; j < totalComponents; j += stream.numComponents) {
                                vec.set(subarray[j], subarray[j + 1], subarray[j + 2]);
                                transform.transformPoint(vec, vec);
                                subarray[j] = vec.x;
                                subarray[j + 1] = vec.y;
                                subarray[j + 2] = vec.z;
                            }
                        } else if (semantic === SEMANTIC_NORMAL || semantic === SEMANTIC_TANGENT) {

                            // handle non-uniform scale by using transposed inverse matrix to transform vectors
                            mat3.invertMat4(transform).transpose();

                            for (let j = 0; j < totalComponents; j += stream.numComponents) {
                                vec.set(subarray[j], subarray[j + 1], subarray[j + 2]);
                                mat3.transformVector(vec, vec);
                                subarray[j] = vec.x;
                                subarray[j + 1] = vec.y;
                                subarray[j + 2] = vec.z;
                            }
                        }
                    }
                }
            }

            // bone index is mesh index
            if (dynamic) {
                stream = streams[SEMANTIC_BLENDINDICES];
                for (let j = 0; j < numVerts; j++)
                    stream.buffer[stream.count++] = i;
            }

            // index buffer
            if (mesh.primitive[0].indexed) {
                indexBase = mesh.primitive[0].base;
                numIndices = mesh.primitive[0].count;

                // source index buffer data mapped to its format
                const srcFormat = mesh.indexBuffer[0].getFormat();
                indexData = new typedArrayIndexFormats[srcFormat](mesh.indexBuffer[0].storage);

            } else { // non-indexed

                const primitiveType = mesh.primitive[0].type;
                if (primitiveType === PRIMITIVE_TRIFAN || primitiveType === PRIMITIVE_TRISTRIP) {
                    if (mesh.primitive[0].count === 4) {
                        indexBase = 0;
                        numIndices = 6;
                        indexData = primitiveType === PRIMITIVE_TRIFAN ? _triFanIndices : _triStripIndices;
                    } else {
                        numIndices = 0;
                        continue;
                    }
                }
            }

            for (let j = 0; j < numIndices; j++) {
                indices[j + indexOffset] = indexData[indexBase + j] + verticesOffset;
            }

            indexOffset += numIndices;
            verticesOffset += numVerts;
        }

        // Create mesh
        mesh = new Mesh(this.device);
        for (semantic in streams) {
            stream = streams[semantic];
            mesh.setVertexStream(semantic, stream.buffer, stream.numComponents, undefined, stream.dataType, stream.normalize);
        }

        if (indices.length > 0)
            mesh.setIndices(indices);

        mesh.update(PRIMITIVE_TRIANGLES, false);

        // Patch the material
        if (dynamic) {
            material = material.clone();
            material.chunks.transformVS = this.transformVS;
            material.chunks.skinTexVS = this.skinTexVS;
            material.chunks.skinConstVS = this.skinConstVS;
            material.update();
        }

        // Create meshInstance
        const meshInstance = new MeshInstance(mesh, material, this.rootNode);
        meshInstance.castShadow = batch.origMeshInstances[0].castShadow;
        meshInstance.parameters = batch.origMeshInstances[0].parameters;
        meshInstance.layer = batch.origMeshInstances[0].layer;
        meshInstance._shaderDefs = batch.origMeshInstances[0]._shaderDefs;

        // meshInstance culling - don't cull UI elements, as they use custom culling Component.isVisibleForCamera
        meshInstance.cull = batch.origMeshInstances[0].cull;
        const batchGroup = this._batchGroups[batchGroupId];
        if (batchGroup && batchGroup._ui)
            meshInstance.cull = false;

        if (dynamic) {
            // Create skinInstance
            const nodes = [];
            for (let i = 0; i < batch.origMeshInstances.length; i++) {
                nodes.push(batch.origMeshInstances[i].node);
            }
            meshInstance.skinInstance = new SkinBatchInstance(this.device, nodes, this.rootNode);
        }

        // disable aabb update, gets updated manually by batcher
        meshInstance._updateAabb = false;

        meshInstance.drawOrder = batch.origMeshInstances[0].drawOrder;
        meshInstance.stencilFront = batch.origMeshInstances[0].stencilFront;
        meshInstance.stencilBack = batch.origMeshInstances[0].stencilBack;
        meshInstance.flipFacesFactor = getScaleSign(batch.origMeshInstances[0]);
        meshInstance.castShadow = batch.origMeshInstances[0].castShadow;

        batch.meshInstance = meshInstance;
        batch.updateBoundingBox();
    }

    // #if _PROFILER
    this._stats.createTime += now() - time;
    // #endif

    return batch;
}
