async getSnapshotWithPlugins(params = {}) {

    // We use gl.readPixels to get the WebGL canvas snapshot in a new
    // HTMLCanvas element, scaled to the target snapshot size, then
    // use html2canvas to render each plugin's container element into
    // that HTMLCanvas. Finally, we save the HTMLCanvas to a bitmap.

    // We don't rely on html2canvas to up-scale our WebGL canvas
    // when we want a higher-resolution snapshot, which would cause
    // blurring. Instead, we manage the scale and redraw of the WebGL
    // canvas ourselves, in order to allow the Viewer to render the
    // right amount of pixels, for a sharper image.


    const needFinishSnapshot = (!this._snapshotBegun);
    const resize = (params.width !== undefined && params.height !== undefined);
    const canvas = this.scene.canvas.canvas;
    const saveWidth = canvas.clientWidth;
    const saveHeight = canvas.clientHeight;
    const snapshotWidth = params.width ? Math.floor(params.width) : canvas.width;
    const snapshotHeight = params.height ? Math.floor(params.height) : canvas.height;

    if (resize) {
        canvas.width = snapshotWidth;
        canvas.height = snapshotHeight;
    }

    if (!this._snapshotBegun) {
        this.beginSnapshot();
    }

    if (!params.includeGizmos) {
        this.sendToPlugins("snapshotStarting"); // Tells plugins to hide things that shouldn't be in snapshot
    }

    this.scene._renderer.renderSnapshot();

    const snapshotCanvas = this.scene._renderer.readSnapshotAsCanvas();

    if (resize) {
        canvas.width = saveWidth;
        canvas.height = saveHeight;
        this.scene.glRedraw();
    }

    const pluginToCapture = {};
    const pluginContainerElements = [];

    for (let i = 0, len = this._plugins.length; i < len; i++) { // Find plugin container elements
        const plugin = this._plugins[i];
        if (plugin.getContainerElement) {
            const containerElement = plugin.getContainerElement();
            if (containerElement !== document.body) {
                if (!pluginToCapture[containerElement.id]) {
                    pluginToCapture[containerElement.id] = true;
                    pluginContainerElements.push(containerElement);
                }
            }
        }
    }

    for (let i = 0, len = pluginContainerElements.length; i < len; i++) {
        const containerElement = pluginContainerElements[i];
        await html2canvas(containerElement, {
            canvas: snapshotCanvas,
            backgroundColor: null,
            scale: snapshotCanvas.width / containerElement.clientWidth
        });
    }
    if (!params.includeGizmos) {
        this.sendToPlugins("snapshotFinished");
    }
    if (needFinishSnapshot) {
        this.endSnapshot();
    }
    let format = params.format || "png";
    if (format !== "jpeg" && format !== "png" && format !== "bmp") {
        console.error("Unsupported image format: '" + format + "' - supported types are 'jpeg', 'bmp' and 'png' - defaulting to 'png'");
        format = "png";
    }
    if (!params.includeGizmos) {
        this.sendToPlugins("snapshotFinished");
    }
    if (needFinishSnapshot) {
        this.endSnapshot();
    }
    return snapshotCanvas.toDataURL(`image/${format}`);
}
