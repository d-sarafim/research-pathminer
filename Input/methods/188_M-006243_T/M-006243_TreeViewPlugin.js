_synchNodesToEntities() {
    const objectIds = Object.keys(this.viewer.metaScene.metaObjects);
    const metaObjects = this._viewer.metaScene.metaObjects;
    const objects = this._viewer.scene.objects;
    for (let i = 0, len = objectIds.length; i < len; i++) {
        const objectId = objectIds[i];
        const metaObject = metaObjects[objectId];
        if (metaObject) {
            const node = this._objectNodes[objectId];
            if (node) {
                const entity = objects[objectId];
                if (entity) {
                    const visible = entity.visible;
                    node.numEntities = 1;
                    node.xrayed = entity.xrayed;
                    if (visible) {
                        node.numVisibleEntities = 1;
                        node.checked = true;
                    } else {
                        node.numVisibleEntities = 0;
                        node.checked = false;
                    }
                    let parent = node.parent; // Synch parents
                    while (parent) {
                        parent.numEntities++;
                        if (visible) {
                            parent.numVisibleEntities++;
                            parent.checked = true;
                        }
                        parent = parent.parent;
                    }
                }
            }
        }
    }
}
