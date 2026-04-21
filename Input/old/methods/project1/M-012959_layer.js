removeMeshInstances(meshInstances, skipShadowCasters) {

    const destMeshInstances = this.meshInstances;
    const destMeshInstancesSet = this.meshInstancesSet;

    // mesh instances
    for (let i = 0; i < meshInstances.length; i++) {
        const mi = meshInstances[i];

        // remove from mesh instances list
        if (destMeshInstancesSet.has(mi)) {
            destMeshInstancesSet.delete(mi);
            const j = destMeshInstances.indexOf(mi);
            if (j >= 0) {
                destMeshInstances.splice(j, 1);
            }
        }
    }

    // shadow casters
    if (!skipShadowCasters) {
        this.removeShadowCasters(meshInstances);
    }
}
