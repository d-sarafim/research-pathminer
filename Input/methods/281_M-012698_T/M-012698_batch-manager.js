prepare(meshInstances, dynamic, maxAabbSize = Number.POSITIVE_INFINITY, translucent) {
    if (meshInstances.length === 0) return [];
    const halfMaxAabbSize = maxAabbSize * 0.5;
    const maxInstanceCount = this.device.supportsBoneTextures ? 1024 : this.device.boneLimit;

    // maximum number of vertices that can be used in batch depends on 32bit index buffer support (do this for non-indexed as well,
    // as in some cases (UI elements) non-indexed geometry gets batched into indexed)
    const maxNumVertices = this.device.extUintElement ? 0xffffffff : 0xffff;

    const aabb = new BoundingBox();
    const testAabb = new BoundingBox();
    let skipTranslucentAabb = null;
    let sf;

    const lists = [];
    let j = 0;
    if (translucent) {
        meshInstances.sort(function (a, b) {
            return a.drawOrder - b.drawOrder;
        });
    }
    let meshInstancesLeftA = meshInstances;
    let meshInstancesLeftB;

    const skipMesh = translucent ? function (mi) {
        if (skipTranslucentAabb) {
            skipTranslucentAabb.add(mi.aabb);
        } else {
            skipTranslucentAabb = mi.aabb.clone();
        }
        meshInstancesLeftB.push(mi);
    } : function (mi) {
        meshInstancesLeftB.push(mi);
    };

    while (meshInstancesLeftA.length > 0) {
        lists[j] = [meshInstancesLeftA[0]];
        meshInstancesLeftB = [];
        const material = meshInstancesLeftA[0].material;
        const layer = meshInstancesLeftA[0].layer;
        const defs = meshInstancesLeftA[0]._shaderDefs;
        const params = meshInstancesLeftA[0].parameters;
        const stencil = meshInstancesLeftA[0].stencilFront;
        let vertCount = meshInstancesLeftA[0].mesh.vertexBuffer.getNumVertices();
        const drawOrder = meshInstancesLeftA[0].drawOrder;
        aabb.copy(meshInstancesLeftA[0].aabb);
        const scaleSign = getScaleSign(meshInstancesLeftA[0]);
        const vertexFormatBatchingHash = meshInstancesLeftA[0].mesh.vertexBuffer.format.batchingHash;
        const indexed = meshInstancesLeftA[0].mesh.primitive[0].indexed;
        skipTranslucentAabb = null;

        for (let i = 1; i < meshInstancesLeftA.length; i++) {
            const mi = meshInstancesLeftA[i];

            // Split by instance number
            if (dynamic && lists[j].length >= maxInstanceCount) {
                meshInstancesLeftB = meshInstancesLeftB.concat(meshInstancesLeftA.slice(i));
                break;
            }

            // Split by material, layer (legacy), vertex format & index compatibility, shader defines, static source, vert count, overlapping UI
            if ((material !== mi.material) ||
                (layer !== mi.layer) ||
                (vertexFormatBatchingHash !== mi.mesh.vertexBuffer.format.batchingHash) ||
                (indexed !== mi.mesh.primitive[0].indexed) ||
                (defs !== mi._shaderDefs) ||
                (vertCount + mi.mesh.vertexBuffer.getNumVertices() > maxNumVertices)) {
                skipMesh(mi);
                continue;
            }
            // Split by AABB
            testAabb.copy(aabb);
            testAabb.add(mi.aabb);
            if (testAabb.halfExtents.x > halfMaxAabbSize ||
                testAabb.halfExtents.y > halfMaxAabbSize ||
                testAabb.halfExtents.z > halfMaxAabbSize) {
                skipMesh(mi);
                continue;
            }
            // Split stencil mask (UI elements), both front and back expected to be the same
            if (stencil) {
                if (!(sf = mi.stencilFront) || stencil.func !== sf.func || stencil.zpass !== sf.zpass) {
                    skipMesh(mi);
                    continue;
                }
            }
            // Split by negative scale
            if (scaleSign !== getScaleSign(mi)) {
                skipMesh(mi);
                continue;
            }

            // Split by parameters
            if (!equalParamSets(params, mi.parameters)) {
                skipMesh(mi);
                continue;
            }

            if (translucent && skipTranslucentAabb && skipTranslucentAabb.intersects(mi.aabb) && mi.drawOrder !== drawOrder) {
                skipMesh(mi);
                continue;
            }

            aabb.add(mi.aabb);
            vertCount += mi.mesh.vertexBuffer.getNumVertices();
            lists[j].push(mi);
        }

        j++;
        meshInstancesLeftA = meshInstancesLeftB;
    }

    return lists;
}
