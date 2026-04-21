_getPrjShell() {
    const shell = super._getPrjShell();
    const projection = this._getProjection();
    if (!projection.isSphere()) {
        return shell;
    }
    const sphereExtent = projection.getSphereExtent(),
        sx = sphereExtent.sx,
        sy = sphereExtent.sy;
    const circum = this._getProjection().getCircum();
    const nw = shell[0];
    for (let i = 1, l = shell.length; i < l; i++) {
        const p = shell[i];
        let dx = 0, dy = 0;
        if (sx * (nw.x - p.x) > 0) {
            dx = circum.x * sx;
        }
        if (sy * (nw.y - p.y) < 0) {
            dy = circum.y * sy;
        }
        shell[i]._add(dx, dy);
    }
    return shell;
}
