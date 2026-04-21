class FrustumPlane {

    constructor() {
        this.normal = math.vec3();
        this.offset = 0;
        this.testVertex = math.vec3();
    }

    set(nx, ny, nz, offset) {
        const s = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
        this.normal[0] = nx * s;
        this.normal[1] = ny * s;
        this.normal[2] = nz * s;
        this.offset = offset * s;
        this.testVertex[0] = (this.normal[0] >= 0.0) ? 1 : 0;
        this.testVertex[1] = (this.normal[1] >= 0.0) ? 1 : 0;
        this.testVertex[2] = (this.normal[2] >= 0.0) ? 1 : 0;
    }
}
