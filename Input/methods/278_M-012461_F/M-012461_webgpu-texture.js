uploadExternalImage(device, image, mipLevel, face) {

    Debug.assert(mipLevel < this.descr.mipLevelCount, `Accessing mip level ${mipLevel} of texture with ${this.descr.mipLevelCount} mip levels`, this);

    const src = {
        source: image,
        origin: [0, 0],
        flipY: false
    };

    const dst = {
        texture: this.gpuTexture,
        mipLevel: mipLevel,
        origin: [0, 0, face],
        aspect: 'all'  // can be: "all", "stencil-only", "depth-only"
    };

    const copySize = {
        width: this.descr.size.width,
        height: this.descr.size.height,
        depthOrArrayLayers: 1   // single layer
    };

    // submit existing scheduled commands to the queue before copying to preserve the order
    device.submit();

    Debug.trace(TRACEID_RENDER_QUEUE, `IMAGE-TO-TEX: mip:${mipLevel} face:${face} ${this.texture.name}`);
    device.wgpu.queue.copyExternalImageToTexture(src, dst, copySize);
}
