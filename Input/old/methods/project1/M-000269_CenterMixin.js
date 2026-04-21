_getCenter2DPoint(res) {
    const map = this.getMap();
    if (!map) {
        return null;
    }
    const pcenter = this._getPrjCoordinates();
    if (!pcenter) { return null; }
    if (!res) {
        res = map._getResolution();
    }
    return map._prjToPointAtRes(pcenter, res);
}
