getPoint(t) {

    var vector = math.vec3();

    vector[0] = math.b3(t, this._v0[0], this._v1[0], this._v2[0], this._v3[0]);
    vector[1] = math.b3(t, this._v0[1], this._v1[1], this._v2[1], this._v3[1]);
    vector[2] = math.b3(t, this._v0[2], this._v1[2], this._v2[2], this._v3[2]);

    return vector;
}
