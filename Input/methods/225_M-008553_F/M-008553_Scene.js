setObjectsVisible(ids, visible) {
    return this.withObjects(ids, entity => {
        const changed = (entity.visible !== visible);
        entity.visible = visible;
        return changed;
    });
}
