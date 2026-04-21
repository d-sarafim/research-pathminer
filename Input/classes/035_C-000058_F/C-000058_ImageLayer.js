class ImageLayer extends Layer {

    constructor(id, images, options) {
        if (images && !Array.isArray(images) && !images.url) {
            options = images;
            images = null;
        }
        super(id, options);
        this._images = images;
    }

    onAdd() {
        this._prepareImages(this._images);
    }

    /**
     * Set images and redraw
     * @param {Object[]} images - new images
     * @return {ImageLayer} this
     */
    setImages(images) {
        this._images = images;
        this._prepareImages(images);
        return this;
    }

    /**
     * Get images
     * @return {Object[]}
     */
    getImages() {
        return this._images;
    }

    _prepareImages(images) {
        images = images || [];
        if (!Array.isArray(images)) {
            images = [images];
        }
        const map = this.getMap();
        const glRes = map.getGLRes();
        this._imageData = images.map(img => {
            const extent = new Extent(img.extent);
            return extend({}, img, {
                extent: extent,
                extent2d: extent.convertTo(c => map.coordToPointAtRes(c, glRes))
            });
        });
        this._images = images;
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.refreshImages();
        }
    }
}
