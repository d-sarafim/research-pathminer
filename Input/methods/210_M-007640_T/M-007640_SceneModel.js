createMesh(cfg) {

    if (cfg.id === undefined || cfg.id === null) {
        this.error("[createMesh] SceneModel.createMesh() config missing: id");
        return;
    }

    if (this._scheduledMeshes[cfg.id]) {
        this.error(`[createMesh] SceneModel already has a mesh with this ID: ${cfg.id}`);
        return;
    }

    const instancing = (cfg.geometryId !== undefined);
    const batching = !instancing;

    cfg.sceneModelMatrix = this._sceneModelMatrixNonIdentity ? this._sceneModelMatrix : null;

    if (batching) {

        // Batched geometry

        const useDTX = !!this._dtxEnabled;

        if (cfg.primitive === undefined || cfg.primitive === null) {
            cfg.primitive = "triangles";
        }
        if (cfg.primitive !== "points" && cfg.primitive !== "lines" && cfg.primitive !== "triangles" && cfg.primitive !== "solid" && cfg.primitive !== "surface") {
            this.error(`Unsupported value for 'primitive': '${primitive}'  ('geometryId' is absent) - supported values are 'points', 'lines', 'triangles', 'solid' and 'surface'.`);
            return;
        }
        if (!cfg.positions && !cfg.positionsCompressed && !cfg.buckets) {
            this.error("Param expected: 'positions',  'positionsCompressed' or `buckets`  ('geometryId' is absent)");
            return null;
        }
        if (cfg.positions && (cfg.positionsDecodeMatrix || cfg.positionsDecodeBoundary)) {
            this.error("Illegal params: 'positions' not expected with 'positionsDecodeMatrix'/'positionsDecodeBoundary' ('geometryId' is absent)");
            return null;
        }
        if (cfg.positionsCompressed && !cfg.positionsDecodeMatrix && !cfg.positionsDecodeBoundary) {
            this.error("Param expected: 'positionsCompressed' should be accompanied by 'positionsDecodeMatrix'/'positionsDecodeBoundary' ('geometryId' is absent)");
            return null;
        }
        if (cfg.uvCompressed && !cfg.uvDecodeMatrix) {
            this.error("Param expected: 'uvCompressed' should be accompanied by `uvDecodeMatrix` ('geometryId' is absent)");
            return null;
        }
        if (!cfg.buckets && !cfg.indices && cfg.primitive !== "points") {
            this.error(`Param expected: indices (required for '${cfg.primitive}' primitive type)`);
            return null;
        }
        if ((cfg.matrix || cfg.position || cfg.rotation || cfg.scale) && (cfg.positionsCompressed || cfg.positionsDecodeBoundary)) {
            this.error("Unexpected params: 'matrix', 'rotation', 'scale', 'position' not allowed with 'positionsCompressed'");
            return null;
        }

        cfg.origin = cfg.origin ? math.addVec3(this._origin, cfg.origin, math.vec3()) : this._origin;

        // MATRIX - optional for batching

        if (cfg.matrix) {
            cfg.meshMatrix = cfg.matrix;
        } else if (cfg.scale || cfg.rotation || cfg.position) {
            const scale = cfg.scale || DEFAULT_SCALE;
            const position = cfg.position || DEFAULT_POSITION;
            const rotation = cfg.rotation || DEFAULT_ROTATION;
            math.eulerToQuaternion(rotation, "XYZ", DEFAULT_QUATERNION);
            cfg.meshMatrix = math.composeMat4(position, DEFAULT_QUATERNION, scale, math.mat4());
        }

        if (cfg.positionsDecodeBoundary) {
            cfg.positionsDecodeMatrix = createPositionsDecodeMatrix(cfg.positionsDecodeBoundary, math.mat4());
        }

        if (useDTX) {

            // DTX

            cfg.type = DTX;

            // NPR

            cfg.color = (cfg.color) ? new Uint8Array([Math.floor(cfg.color[0] * 255), Math.floor(cfg.color[1] * 255), Math.floor(cfg.color[2] * 255)]) : defaultCompressedColor;
            cfg.opacity = (cfg.opacity !== undefined && cfg.opacity !== null) ? Math.floor(cfg.opacity * 255) : 255;

            // RTC

            if (cfg.positions) {
                const rtcCenter = math.vec3();
                const rtcPositions = [];
                const rtcNeeded = worldToRTCPositions(cfg.positions, rtcPositions, rtcCenter);
                if (rtcNeeded) {
                    cfg.positions = rtcPositions;
                    cfg.origin = math.addVec3(cfg.origin, rtcCenter, rtcCenter);
                }
            }

            // COMPRESSION

            if (cfg.positions) {
                const aabb = math.collapseAABB3();
                cfg.positionsDecodeMatrix = math.mat4();
                math.expandAABB3Points3(aabb, cfg.positions);
                cfg.positionsCompressed = quantizePositions(cfg.positions, aabb, cfg.positionsDecodeMatrix)
            }

            // EDGES

            if (!cfg.buckets && !cfg.edgeIndices && (cfg.primitive === "triangles" || cfg.primitive === "solid" || cfg.primitive === "surface")) {
                if (cfg.positions) { // Faster
                    cfg.edgeIndices = buildEdgeIndices(cfg.positions, cfg.indices, null, 2.0);
                } else {
                    cfg.edgeIndices = buildEdgeIndices(cfg.positionsCompressed, cfg.indices, cfg.positionsDecodeMatrix, 2.0);
                }
            }

            // BUCKETING

            if (!cfg.buckets) {
                cfg.buckets = createDTXBuckets(cfg, this._enableVertexWelding && this._enableIndexBucketing);
            }

        } else {

            // VBO

            cfg.type = VBO_BATCHED;

            // PBR

            cfg.color = (cfg.color) ? new Uint8Array([Math.floor(cfg.color[0] * 255), Math.floor(cfg.color[1] * 255), Math.floor(cfg.color[2] * 255)]) : [255, 255, 255];
            cfg.opacity = (cfg.opacity !== undefined && cfg.opacity !== null) ? Math.floor(cfg.opacity * 255) : 255;
            cfg.metallic = (cfg.metallic !== undefined && cfg.metallic !== null) ? Math.floor(cfg.metallic * 255) : 0;
            cfg.roughness = (cfg.roughness !== undefined && cfg.roughness !== null) ? Math.floor(cfg.roughness * 255) : 255;

            // RTC

            if (cfg.positions) {
                const rtcPositions = [];
                const rtcNeeded = worldToRTCPositions(cfg.positions, rtcPositions, tempVec3a);
                if (rtcNeeded) {
                    cfg.positions = rtcPositions;
                    cfg.origin = math.addVec3(cfg.origin, tempVec3a, math.vec3());
                }
            }

            // EDGES

            if (!cfg.buckets && !cfg.edgeIndices && (cfg.primitive === "triangles" || cfg.primitive === "solid" || cfg.primitive === "surface")) {
                if (cfg.positions) {
                    cfg.edgeIndices = buildEdgeIndices(cfg.positions, cfg.indices, null, 2.0);
                } else {
                    cfg.edgeIndices = buildEdgeIndices(cfg.positionsCompressed, cfg.indices, cfg.positionsDecodeMatrix, 2.0);
                }
            }

            // TEXTURE

            // cfg.textureSetId = cfg.textureSetId || DEFAULT_TEXTURE_SET_ID;
            if (cfg.textureSetId) {
                cfg.textureSet = this._textureSets[cfg.textureSetId];
                if (!cfg.textureSet) {
                    this.error(`[createMesh] Texture set not found: ${cfg.textureSetId} - ensure that you create it first with createTextureSet()`);
                    return;
                }
            }
        }

    } else {

        // INSTANCING

        if (cfg.positions || cfg.positionsCompressed || cfg.indices || cfg.edgeIndices || cfg.normals || cfg.normalsCompressed || cfg.uv || cfg.uvCompressed || cfg.positionsDecodeMatrix) {
            this.error(`Mesh geometry parameters not expected when instancing a geometry (not expected: positions, positionsCompressed, indices, edgeIndices, normals, normalsCompressed, uv, uvCompressed, positionsDecodeMatrix)`);
            return;
        }

        cfg.geometry = this._geometries[cfg.geometryId];
        if (!cfg.geometry) {
            this.error(`[createMesh] Geometry not found: ${cfg.geometryId} - ensure that you create it first with createGeometry()`);
            return;
        }

        cfg.origin = cfg.origin ? math.addVec3(this._origin, cfg.origin, math.vec3()) : this._origin;
        cfg.positionsDecodeMatrix = cfg.geometry.positionsDecodeMatrix;

        // MATRIX - always have a matrix for instancing

        if (cfg.matrix) {
            cfg.meshMatrix = cfg.matrix.slice();
        } else {
            const scale = cfg.scale || DEFAULT_SCALE;
            const position = cfg.position || DEFAULT_POSITION;
            const rotation = cfg.rotation || DEFAULT_ROTATION;
            math.eulerToQuaternion(rotation, "XYZ", DEFAULT_QUATERNION);
            cfg.meshMatrix = math.composeMat4(position, DEFAULT_QUATERNION, scale, math.mat4());
        }

        const useDTX = !!this._dtxEnabled; // Data textures - disabled by default for now

        if (useDTX) {

            // DTX

            cfg.type = DTX;

            // NPR

            cfg.color = (cfg.color) ? new Uint8Array([Math.floor(cfg.color[0] * 255), Math.floor(cfg.color[1] * 255), Math.floor(cfg.color[2] * 255)]) : defaultCompressedColor;
            cfg.opacity = (cfg.opacity !== undefined && cfg.opacity !== null) ? Math.floor(cfg.opacity * 255) : 255;

            // BUCKETING - lazy generated, reused

            let buckets = this._dtxBuckets[cfg.geometryId];
            if (!buckets) {
                buckets = createDTXBuckets(cfg.geometry, this._enableVertexWelding, this._enableIndexBucketing);
                this._dtxBuckets[cfg.geometryId] = buckets;
            }
            cfg.buckets = buckets;

        } else {

            // VBO

            cfg.type = VBO_INSTANCED;

            // PBR

            cfg.color = (cfg.color) ? new Uint8Array([Math.floor(cfg.color[0] * 255), Math.floor(cfg.color[1] * 255), Math.floor(cfg.color[2] * 255)]) : defaultCompressedColor;
            cfg.opacity = (cfg.opacity !== undefined && cfg.opacity !== null) ? Math.floor(cfg.opacity * 255) : 255;
            cfg.metallic = (cfg.metallic !== undefined && cfg.metallic !== null) ? Math.floor(cfg.metallic * 255) : 0;
            cfg.roughness = (cfg.roughness !== undefined && cfg.roughness !== null) ? Math.floor(cfg.roughness * 255) : 255;

            // TEXTURE

            if (cfg.textureSetId) {
                cfg.textureSet = this._textureSets[cfg.textureSetId];
                // if (!cfg.textureSet) {
                //     this.error(`[createMesh] Texture set not found: ${cfg.textureSetId} - ensure that you create it first with createTextureSet()`);
                //     return;
                // }
            }

            // OBB - used for fast AABB calculation

            createGeometryOBB(cfg.geometry)
        }
    }

    cfg.numPrimitives = this._getNumPrimitives(cfg);

    if (this._vfcManager && !this._vfcManager.finalized) {
        this._vfcManager.addMesh(cfg); // Deferred so VFC manager can cluster meshes for GPU cache locality
    } else {
        this._createMesh(cfg);
    }
}
