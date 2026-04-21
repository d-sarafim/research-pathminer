prepare(camera, scene, layers) {

    // handle deprecated arguments
    if (camera instanceof Camera) {
        Debug.deprecated('pc.Picker#prepare now takes pc.CameraComponent as first argument. Passing pc.Camera is deprecated.');

        // Get the camera component
        camera = camera.node.camera;
    }

    if (layers instanceof Layer) {
        layers = [layers];
    }

    // populate the layer with meshes and depth clear commands
    this.layer.clearMeshInstances();
    const destMeshInstances = this.layer.meshInstances;

    // source mesh instances
    const srcLayers = scene.layers.layerList;
    const subLayerEnabled = scene.layers.subLayerEnabled;
    const isTransparent = scene.layers.subLayerList;

    for (let i = 0; i < srcLayers.length; i++) {
        const srcLayer = srcLayers[i];

        // skip the layer if it does not match the provided ones
        if (layers && layers.indexOf(srcLayer) < 0) {
            continue;
        }

        if (srcLayer.enabled && subLayerEnabled[i]) {

            // if the layer is rendered by the camera
            const layerCamId = srcLayer.cameras.indexOf(camera);
            if (layerCamId >= 0) {

                // if the layer clears the depth, add command to clear it
                if (srcLayer._clearDepthBuffer) {
                    destMeshInstances.push(this.clearDepthCommand);
                }

                // copy all pickable mesh instances
                const transparent = isTransparent[i];
                const meshInstances = srcLayer.meshInstances;
                for (let j = 0; j < meshInstances.length; j++) {
                    const meshInstance = meshInstances[j];
                    if (meshInstance.pick && meshInstance.transparent === transparent) {

                        // as we only render opaque meshes on our internal meshes, mark this mesh as opaque
                        if (meshInstance.transparent) {
                            meshInstance.transparent = false;
                            tempSet.add(meshInstance);
                        }

                        destMeshInstances.push(meshInstance);
                    }
                }
            }
        }
    }

    // make the render target the right size
    if (!this.renderTarget || (this.width !== this.renderTarget.width || this.height !== this.renderTarget.height)) {
        this.releaseRenderTarget();
        this.allocateRenderTarget();
    }

    // prepare the rendering camera
    this.updateCamera(camera);

    // clear registered meshes mapping
    this.mapping.length = 0;

    // render
    this.app.renderComposition(this.layerComp);

    // mark all meshes as transparent again
    tempSet.forEach((meshInstance) => {
        meshInstance.transparent = true;
    });
    tempSet.clear();
}
