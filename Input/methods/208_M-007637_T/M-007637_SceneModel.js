createGeometry(cfg) {
    if (cfg.id === undefined || cfg.id === null) {
        this.error("[createGeometry] Config missing: id");
        return;
    }
    if (this._geometries[cfg.id]) {
        this.error("[createGeometry] Geometry already created: " + cfg.id);
        return;
    }
    if (cfg.primitive === undefined || cfg.primitive === null) {
        cfg.primitive = "triangles";
    }
    if (cfg.primitive !== "points" && cfg.primitive !== "lines" && cfg.primitive !== "triangles" && cfg.primitive !== "solid" && cfg.primitive !== "surface") {
        this.error(`[createGeometry] Unsupported value for 'primitive': '${primitive}' - supported values are 'points', 'lines', 'triangles', 'solid' and 'surface'. Defaulting to 'triangles'.`);
        return;
    }
    if (!cfg.positions && !cfg.positionsCompressed && !cfg.buckets) {
        this.error("[createGeometry] Param expected: `positions`,  `positionsCompressed' or 'buckets");
        return null;
    }
    if (cfg.positionsCompressed && !cfg.positionsDecodeMatrix && !cfg.positionsDecodeBoundary) {
        this.error("[createGeometry] Param expected: `positionsDecodeMatrix` or 'positionsDecodeBoundary' (required for `positionsCompressed')");
        return null;
    }
    if (cfg.positionsDecodeMatrix && cfg.positionsDecodeBoundary) {
        this.error("[createGeometry] Only one of these params expected: `positionsDecodeMatrix` or 'positionsDecodeBoundary' (required for `positionsCompressed')");
        return null;
    }
    if (cfg.uvCompressed && !cfg.uvDecodeMatrix) {
        this.error("[createGeometry] Param expected: `uvDecodeMatrix` (required for `uvCompressed')");
        return null;
    }
    if (!cfg.buckets && !cfg.indices && cfg.primitive !== "points") {
        this.error(`[createGeometry] Param expected: indices (required for '${cfg.primitive}' primitive type)`);
        return null;
    }
    if (cfg.positionsDecodeBoundary) {
        cfg.positionsDecodeMatrix = createPositionsDecodeMatrix(cfg.positionsDecodeBoundary, math.mat4());
    }
    if (cfg.positions) {
        const aabb = math.collapseAABB3();
        cfg.positionsDecodeMatrix = math.mat4();
        math.expandAABB3Points3(aabb, cfg.positions);
        cfg.positionsCompressed = quantizePositions(cfg.positions, aabb, cfg.positionsDecodeMatrix);
    } else {
        cfg.positionsDecodeMatrix = new Float64Array(cfg.positionsDecodeMatrix);
        cfg.positionsCompressed = new Uint16Array(cfg.positionsCompressed);
    }
    if (cfg.colorsCompressed && cfg.colorsCompressed.length > 0) {
        cfg.colorsCompressed = new Uint8Array(cfg.colorsCompressed);
    } else if (cfg.colors && cfg.colors.length > 0) {
        const colors = cfg.colors;
        const colorsCompressed = new Uint8Array(colors.length);
        for (let i = 0, len = colors.length; i < len; i++) {
            colorsCompressed[i] = colors[i] * 255;
        }
        cfg.colorsCompressed = colorsCompressed;
    }
    if (!cfg.buckets && !cfg.edgeIndices && (cfg.primitive === "triangles" || cfg.primitive === "solid" || cfg.primitive === "surface")) {
        if (cfg.positions) {
            cfg.edgeIndices = buildEdgeIndices(cfg.positions, cfg.indices, null, 5.0);
        } else {
            cfg.edgeIndices = buildEdgeIndices(cfg.positionsCompressed, cfg.indices, cfg.positionsDecodeMatrix, 2.0);
        }
    }
    if (cfg.buckets) {
        this._dtxBuckets[cfg.id] = cfg.buckets;
    }
    if (cfg.uv) {
        const bounds = geometryCompressionUtils.getUVBounds(cfg.uv);
        const result = geometryCompressionUtils.compressUVs(cfg.uv, bounds.min, bounds.max);
        cfg.uvCompressed = result.quantized;
        cfg.uvDecodeMatrix = result.decodeMatrix;
    } else if (cfg.uvCompressed) {
        cfg.uvCompressed = new Uint16Array(cfg.uvCompressed);
        cfg.uvDecodeMatrix = new Float64Array(cfg.uvDecodeMatrix);
    }
    if (cfg.normals) { // HACK
        cfg.normals = null;
    }
    this._geometries [cfg.id] = cfg;
    this._numTriangles += (cfg.indices ? Math.round(cfg.indices.length / 3) : 0);
    this.numGeometries++;
}
