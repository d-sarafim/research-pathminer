export class ImageLayerGLRenderer extends ImageGLRenderable(ImageLayerCanvasRenderer) {
    drawOnInteracting(event, timestamp, context) {
        this.draw(timestamp, context);
    }

    _prepareGLContext() {
        const gl = this.gl;
        if (gl) {
            gl.disable(gl.STENCIL_TEST);
            gl.disable(gl.POLYGON_OFFSET_FILL);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthFunc(getDepthFunc(this.layer.options['depthFunc']));
            const depthMask = isNil(this.layer.options['depthMask']) || !!this.layer.options['depthMask'];
            gl.depthMask(depthMask);
        }
    }

    _drawImages(timestamp, parentContext) {
        const gl = this.gl;
        if (parentContext && parentContext.renderTarget) {
            const fbo = parentContext.renderTarget.fbo;
            if (fbo) {
                const framebuffer = parentContext.renderTarget.getFramebuffer(fbo);
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            }
        }
        this._prepareGLContext();
        super._drawImages();
        if (parentContext && parentContext.renderTarget) {
            const fbo = parentContext.renderTarget.fbo;
            if (fbo) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }
        }
    }

    //override to set to always drawable
    isDrawable() {
        return true;
    }

    _drawImage(image, extent, opacity) {
        this.drawGLImage(image, extent.xmin, extent.ymax, extent.getWidth(), extent.getHeight(), 1, opacity);
    }

    createContext() {
        this.createGLContext();
    }

    resizeCanvas(canvasSize) {
        if (!this.canvas) {
            return;
        }
        super.resizeCanvas(canvasSize);
        this.resizeGLCanvas();
    }

    clearCanvas() {
        if (!this.canvas) {
            return;
        }
        super.clearCanvas();
        this.clearGLCanvas();
    }

    retireImage(image) {
        if (image.close) {
            image.close();
        }
        this.disposeImage(image);
    }

    onRemove() {
        this.removeGLCanvas();
        super.onRemove();
    }
}
