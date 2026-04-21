init(device, target) {
    const gl = device.gl;

    // ##### Create main FBO #####
    this._glFrameBuffer = gl.createFramebuffer();
    device.setFramebuffer(this._glFrameBuffer);

    // --- Init the provided color buffer (optional) ---
    const colorBufferCount = target._colorBuffers?.length ?? 0;
    const attachmentBaseConstant = device.webgl2 ? gl.COLOR_ATTACHMENT0 : (device.extDrawBuffers?.COLOR_ATTACHMENT0_WEBGL ?? gl.COLOR_ATTACHMENT0);
    const buffers = [];
    for (let i = 0; i < colorBufferCount; ++i) {
        const colorBuffer = target.getColorBuffer(i);
        if (colorBuffer) {
            if (!colorBuffer.impl._glTexture) {
                // Clamp the render buffer size to the maximum supported by the device
                colorBuffer._width = Math.min(colorBuffer.width, device.maxRenderBufferSize);
                colorBuffer._height = Math.min(colorBuffer.height, device.maxRenderBufferSize);
                device.setTexture(colorBuffer, 0);
            }
            // Attach the color buffer
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                attachmentBaseConstant + i,
                colorBuffer._cubemap ? gl.TEXTURE_CUBE_MAP_POSITIVE_X + target._face : gl.TEXTURE_2D,
                colorBuffer.impl._glTexture,
                0
            );

            buffers.push(attachmentBaseConstant + i);
        }
    }

    if (device.drawBuffers) {
        device.drawBuffers(buffers);
    }

    const depthBuffer = target._depthBuffer;
    if (depthBuffer) {
        // --- Init the provided depth/stencil buffer (optional, WebGL2 only) ---
        if (!depthBuffer.impl._glTexture) {
            // Clamp the render buffer size to the maximum supported by the device
            depthBuffer._width = Math.min(depthBuffer.width, device.maxRenderBufferSize);
            depthBuffer._height = Math.min(depthBuffer.height, device.maxRenderBufferSize);
            device.setTexture(depthBuffer, 0);
        }
        // Attach
        if (target._stencil) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT,
                                    depthBuffer._cubemap ? gl.TEXTURE_CUBE_MAP_POSITIVE_X + target._face : gl.TEXTURE_2D,
                                    target._depthBuffer.impl._glTexture, 0);
        } else {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                                    depthBuffer._cubemap ? gl.TEXTURE_CUBE_MAP_POSITIVE_X + target._face : gl.TEXTURE_2D,
                                    target._depthBuffer.impl._glTexture, 0);
        }
    } else if (target._depth) {
        // --- Init a new depth/stencil buffer (optional) ---
        // if device is a MSAA RT, and no buffer to resolve to, skip creating non-MSAA depth
        const willRenderMsaa = target._samples > 1 && device.webgl2;
        if (!willRenderMsaa) {
            if (!this._glDepthBuffer) {
                this._glDepthBuffer = gl.createRenderbuffer();
            }
            gl.bindRenderbuffer(gl.RENDERBUFFER, this._glDepthBuffer);
            if (target._stencil) {
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, target.width, target.height);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this._glDepthBuffer);
            } else {
                const depthFormat = device.webgl2 ? gl.DEPTH_COMPONENT32F : gl.DEPTH_COMPONENT16;
                gl.renderbufferStorage(gl.RENDERBUFFER, depthFormat, target.width, target.height);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._glDepthBuffer);
            }
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }
    }

    Debug.call(() => this._checkFbo(device, target));

    // ##### Create MSAA FBO (WebGL2 only) #####
    if (device.webgl2 && target._samples > 1) {

        // Use previous FBO for resolves
        this._glResolveFrameBuffer = this._glFrameBuffer;

        // Actual FBO will be MSAA
        this._glFrameBuffer = gl.createFramebuffer();
        device.setFramebuffer(this._glFrameBuffer);

        // Create an optional MSAA color buffers

        const colorBufferCount = target._colorBuffers?.length ?? 0;
        for (let i = 0; i < colorBufferCount; ++i) {
            const colorBuffer = target.getColorBuffer(i);
            if (colorBuffer) {
                const buffer = gl.createRenderbuffer();
                this._glMsaaColorBuffers.push(buffer);

                gl.bindRenderbuffer(gl.RENDERBUFFER, buffer);
                gl.renderbufferStorageMultisample(gl.RENDERBUFFER, target._samples, colorBuffer.impl._glInternalFormat, target.width, target.height);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.RENDERBUFFER, buffer);
            }
        }

        // Optionally add a MSAA depth/stencil buffer
        if (target._depth) {
            if (!this._glMsaaDepthBuffer) {
                this._glMsaaDepthBuffer = gl.createRenderbuffer();
            }
            gl.bindRenderbuffer(gl.RENDERBUFFER, this._glMsaaDepthBuffer);
            if (target._stencil) {
                gl.renderbufferStorageMultisample(gl.RENDERBUFFER, target._samples, gl.DEPTH24_STENCIL8, target.width, target.height);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this._glMsaaDepthBuffer);
            } else {
                gl.renderbufferStorageMultisample(gl.RENDERBUFFER, target._samples, gl.DEPTH_COMPONENT32F, target.width, target.height);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._glMsaaDepthBuffer);
            }
        }

        Debug.call(() => this._checkFbo(device, target, 'MSAA'));

        if (colorBufferCount > 1) {
            // create framebuffers allowing us to individually resolve each color buffer
            this._createMsaaMrtFramebuffers(device, target, colorBufferCount);

            // restore rendering back to the main framebuffer
            device.setFramebuffer(this._glFrameBuffer);
            device.drawBuffers(buffers);
        }
    }
}
