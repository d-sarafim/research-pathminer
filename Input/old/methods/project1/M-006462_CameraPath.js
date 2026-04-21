sampleFrame(t, eye, look, up) {
    t = t < 0.0 ? 0.0 : (t > 1.0 ? 1.0 : t);
    this._eyeCurve.getPoint(t, eye);
    this._lookCurve.getPoint(t, look);
    this._upCurve.getPoint(t, up);
}
