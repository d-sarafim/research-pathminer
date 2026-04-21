worldToRealPos(worldPos, realPos = math.vec3(3)) {
    realPos[0] = this._origin[0] + (this._scale * worldPos[0]);
    realPos[1] = this._origin[1] + (this._scale * worldPos[1]);
    realPos[2] = this._origin[2] + (this._scale * worldPos[2]);
}
