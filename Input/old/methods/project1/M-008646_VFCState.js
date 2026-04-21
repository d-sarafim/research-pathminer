_cullNonVisibleNodes(sceneModel, cullFrame) {
    const internalNodesList = this._internalNodesList;
    const lastVisibleFrameOfNodes = this._lastVisibleFrameOfNodes;
    for (let i = 0, len = internalNodesList.length; i < len; i++) {
        if (internalNodesList[i]) {
            internalNodesList[i].culledVFC = lastVisibleFrameOfNodes[i] !== cullFrame;
        }
    }
}
