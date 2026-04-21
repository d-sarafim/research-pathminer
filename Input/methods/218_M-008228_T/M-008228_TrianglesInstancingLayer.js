_setFlags(portionId, flags, meshTransparent) {

    if (!this._finalized) {
        throw "Not finalized";
    }

    const visible = !!(flags & ENTITY_FLAGS.VISIBLE);
    const xrayed = !!(flags & ENTITY_FLAGS.XRAYED);
    const highlighted = !!(flags & ENTITY_FLAGS.HIGHLIGHTED);
    const selected = !!(flags & ENTITY_FLAGS.SELECTED);
    const edges = !!(flags & ENTITY_FLAGS.EDGES);
    const pickable = !!(flags & ENTITY_FLAGS.PICKABLE);
    const culled = !!(flags & ENTITY_FLAGS.CULLED);

    let colorFlag;
    if (!visible || culled || xrayed
        || (highlighted && !this.model.scene.highlightMaterial.glowThrough)
        || (selected && !this.model.scene.selectedMaterial.glowThrough)) {
        colorFlag = RENDER_PASSES.NOT_RENDERED;
    } else {
        if (meshTransparent) {
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

    let edgeFlag = 0;
    if (!visible || culled) {
        edgeFlag = RENDER_PASSES.NOT_RENDERED;
    } else if (selected) {
        edgeFlag = RENDER_PASSES.EDGES_SELECTED;
    } else if (highlighted) {
        edgeFlag = RENDER_PASSES.EDGES_HIGHLIGHTED;
    } else if (xrayed) {
        edgeFlag = RENDER_PASSES.EDGES_XRAYED;
    } else if (edges) {
        if (meshTransparent) {
            edgeFlag = RENDER_PASSES.EDGES_COLOR_TRANSPARENT;
        } else {
            edgeFlag = RENDER_PASSES.EDGES_COLOR_OPAQUE;
        }
    } else {
        edgeFlag = RENDER_PASSES.NOT_RENDERED;
    }

    const pickFlag = (visible && !culled && pickable) ? RENDER_PASSES.PICK : RENDER_PASSES.NOT_RENDERED;

    const clippableFlag = !!(flags & ENTITY_FLAGS.CLIPPABLE) ? 1 : 0;

    let vertFlag = 0;
    vertFlag |= colorFlag;
    vertFlag |= silhouetteFlag << 4;
    vertFlag |= edgeFlag << 8;
    vertFlag |= pickFlag << 12;
    vertFlag |= clippableFlag << 16;

    tempFloat32[0] = vertFlag;

    if (this._state.flagsBuf) {
        this._state.flagsBuf.setData(tempFloat32, portionId);
    }
}
