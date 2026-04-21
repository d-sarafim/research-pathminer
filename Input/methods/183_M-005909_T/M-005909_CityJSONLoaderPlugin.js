_parseCityObject(ctx, cityObject, objectId) {

    const sceneModel = ctx.sceneModel;
    const data = ctx.data;

    if (ctx.loadMetadata) {

        const metaObjectId = objectId;
        const metaObjectType = cityObject.type;
        const metaObjectName = metaObjectType + " : " + objectId;
        const parentMetaObjectId = cityObject.parents ? cityObject.parents[0] : ctx.rootMetaObject.id;

        ctx.metadata.metaObjects.push({
            id: metaObjectId,
            name: metaObjectName,
            type: metaObjectType,
            parent: parentMetaObjectId
        });
    }

    ctx.stats.numMetaObjects++;

    if (!(cityObject.geometry && cityObject.geometry.length > 0)) {
        return;
    }

    const meshIds = [];

    for (let i = 0, len = cityObject.geometry.length; i < len; i++) {

        const geometry = cityObject.geometry[i];

        let objectMaterial;
        let surfaceMaterials;

        const appearance = data.appearance;
        if (appearance) {
            const materials = appearance.materials;
            if (materials) {
                const geometryMaterial = geometry.material;
                if (geometryMaterial) {
                    const themeIds = Object.keys(geometryMaterial);
                    if (themeIds.length > 0) {
                        const themeId = themeIds[0];
                        const theme = geometryMaterial[themeId];
                        if (theme.value !== undefined) {
                            objectMaterial = materials[theme.value];
                        } else {
                            const values = theme.values;
                            if (values) {
                                surfaceMaterials = [];
                                for (let j = 0, lenj = values.length; j < lenj; j++) {
                                    const value = values[i];
                                    const surfaceMaterial = materials[value];
                                    surfaceMaterials.push(surfaceMaterial);
                                }
                            }
                        }
                    }
                }
            }
        }

        if (surfaceMaterials) {
            this._parseGeometrySurfacesWithOwnMaterials(ctx, geometry, surfaceMaterials, meshIds);

        } else {
            this._parseGeometrySurfacesWithSharedMaterial(ctx, geometry, objectMaterial, meshIds);
        }
    }

    if (meshIds.length > 0) {
        sceneModel.createEntity({
            id: objectId,
            meshIds: meshIds,
            isObject: true
        });

        ctx.stats.numObjects++;
    }
}
