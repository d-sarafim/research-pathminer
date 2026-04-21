_createTypesNodes() {
    const rootMetaObjects = this._viewer.metaScene.rootMetaObjects;
    for (let id in rootMetaObjects) {
        this._createTypesNodes2(rootMetaObjects[id], null, null);
    }
}
