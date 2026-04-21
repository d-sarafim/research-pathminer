finalize(sceneModel, fnForceFinalizeLayer) {
    if (this.finalized) {
        throw "Already finalized";
    }
    let lastClusterNumber = -1;
    for (let i = 0, len = this._orderedMeshList.length; i < len; i++) {
        const {clusterNumber, mesh} = this._orderedMeshList [i];
        if (lastClusterNumber !== -1 && lastClusterNumber !== clusterNumber) {
            fnForceFinalizeLayer.call(sceneModel);
        }
        sceneModel._createMesh(mesh);
        lastClusterNumber = clusterNumber;
    }
    // fnForceFinalizeLayer ();
    for (let i = 0, len = this._orderedEntityList.length; i < len; i++) {
        sceneModel._createEntity(this._orderedEntityList[i])
    }
    // Free memory
    this._orderedMeshList = [];
    this._orderedEntityList = [];
    this.finalized = true;
}
