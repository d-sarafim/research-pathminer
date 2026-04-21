_setFlags(portionId, flags, transparent, deferred = false) {

    if (!this._finalized) {
        throw "Not finalized";
    }

    const portionsIdx = portionId * 2;
    const vertexBase = this._portions[portionsIdx];
    const numVerts = this._portions[portionsIdx + 1];
    const firstFlag = vertexBase;
    const lenFlags = numVerts;

    const visible = !!(flags & ENTITY_FLAGS.VISIBLE);
    const xrayed = !!(flags & ENTITY_FLAGS.XRAYED);
    const highlighted = !!(flags & ENTITY_FLAGS.HIGHLIGHTED);
    const selected = !!(flags & ENTITY_FLAGS.SELECTED);
    // no edges
    const pickable = !!(flags & ENTITY_FLAGS.PICKABLE);
    const culled = !!(flags & ENTITY_FLAGS.CULLED);

    let colorFlag;
    if (!visible || culled || xrayed
        || (highlighted && !this.model.scene.highlightMaterial.glowThrough)
        || (selected && !this.model.scene.selectedMaterial.glowThrough)) {
        colorFlag = RENDER_PASSES.NOT_RENDERED;
    } else {
        if (transparent) {
            colorFlag = RENDER_PASSES.COLOR_TRANSPARENT;
        } else {
            colorFlag = RENDER_PASSES.COLOR_OPAQUE;
        }
    }

    let silhouetteFlag;
    if (!visible || culled) {
        silhouetteFlag = RENDER_PASSES.NOT_RENDERED;
    } else if (selected) {
        silhouetteFlag = RENDER_PASSES.SILHOUETTE_SELECTED;
    } else if (highlighted) {
        silhouetteFlag = RENDER_PASSES.SILHOUETTE_HIGHLIGHTED;
    } else if (xrayed) {
        silhouetteFlag = RENDER_PASSES.SILHOUETTE_XRAYED;
    } else {
        silhouetteFlag = RENDER_PASSES.NOT_RENDERED;
    }

    let pickFlag = (visible && !culled && pickable) ? RENDER_PASSES.PICK : RENDER_PASSES.NOT_RENDERED;

    const clippableFlag = !!(flags & ENTITY_FLAGS.CLIPPABLE) ? 1 : 0;

    if (deferred) {
        // Avoid zillions of individual WebGL bufferSubData calls - buffer them to apply in one shot
        if (!this._deferredFlagValues) {
            this._deferredFlagValues = new Float32Array(this._numVerts);
        }
        for (let i = firstFlag, len = (firstFlag + lenFlags); i < len; i++) {
            let vertFlag = 0;
            vertFlag |= colorFlag;
            vertFlag |= silhouetteFlag << 4;
            // no edges
            vertFlag |= pickFlag << 12;
            vertFlag |= clippableFlag << 16;

            this._deferredFlagValues[i] = vertFlag;
        }
    } else if (this._state.flagsBuf) {
        const tempArray = this._scratchMemory.getFloat32Array(lenFlags);
        for (let i = 0; i < lenFlags; i++) {
            let vertFlag = 0;
            vertFlag |= colorFlag;
            vertFlag |= silhouetteFlag << 4;
            // no edges
            vertFlag |= pickFlag << 12;
            vertFlag |= clippableFlag << 16;

            tempArray[i] = vertFlag;
        }
        this._state.flagsBuf.setData(tempArray, firstFlag, lenFlags);
    }
}
