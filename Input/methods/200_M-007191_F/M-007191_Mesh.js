set rotation(value) {
    this._rotation.set(value || [0, 0, 0]);
    math.eulerToQuaternion(this._rotation, "XYZ", this._quaternion);
    this._setLocalMatrixDirty();
    this._setAABBDirty();
    this.glRedraw();
}
