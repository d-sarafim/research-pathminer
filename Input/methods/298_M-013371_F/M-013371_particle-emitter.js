_destroyResources() {
    if (this.particleTexIN) {
        this.particleTexIN.destroy();
        this.particleTexIN = null;
    }

    if (this.particleTexOUT) {
        this.particleTexOUT.destroy();
        this.particleTexOUT = null;
    }

    if (this.particleTexStart && this.particleTexStart.destroy) {
        this.particleTexStart.destroy();
        this.particleTexStart = null;
    }

    if (this.rtParticleTexIN) {
        this.rtParticleTexIN.destroy();
        this.rtParticleTexIN = null;
    }

    if (this.rtParticleTexOUT) {
        this.rtParticleTexOUT.destroy();
        this.rtParticleTexOUT = null;
    }

    if (this.internalTex0) {
        this.internalTex0.destroy();
        this.internalTex0 = null;
    }

    if (this.internalTex1) {
        this.internalTex1.destroy();
        this.internalTex1 = null;
    }

    if (this.internalTex2) {
        this.internalTex2.destroy();
        this.internalTex2 = null;
    }

    if (this.internalTex3) {
        this.internalTex3.destroy();
        this.internalTex3 = null;
    }

    if (this.colorParam) {
        this.colorParam.destroy();
        this.colorParam = null;
    }

    if (this.vertexBuffer) {
        this.vertexBuffer.destroy();
        this.vertexBuffer = undefined; // we are testing if vb is undefined in some code, no idea why
    }

    if (this.indexBuffer) {
        this.indexBuffer.destroy();
        this.indexBuffer = undefined;
    }

    if (this.material) {
        this.material.destroy();
        this.material = null;
    }

    // note: shaders should not be destroyed as they could be shared between emitters
}
