destroyMetaModel(id) {

    const metaModel = this.metaModels[id];
    if (!metaModel) {
        return;
    }

    // Remove global PropertySets

    if (metaModel.propertySets) {
        for (let i = 0, len = metaModel.propertySets.length; i < len; i++) {
            const propertySet = metaModel.propertySets[i];
            if (propertySet.metaModels.length === 1) { // Property set owned by one model, delete
                delete this.propertySets[propertySet.id];
            } else {
                const newMetaModels = [];
                for (let j = 0, lenj = propertySet.metaModels.length; j < lenj; j++) {
                    if (propertySet.metaModels[i].id !== id) {
                        newMetaModels.push(propertySet.metaModels[i]);
                    }
                }
                propertySet.metaModels = newMetaModels;
            }
        }
    }

    // Remove MetaObjects

    if (metaModel.metaObjects) {
        for (let i = 0, len = metaModel.metaObjects.length; i < len; i++) {
            const metaObject = metaModel.metaObjects[i];
            const type = metaObject.type;
            const id = metaObject.id;
            if (metaObject.metaModels.length === 1) { // MetaObject owned by one model, delete
                delete this.metaObjects[id];
                if (!metaObject.parent) {
                    delete this.rootMetaObjects[id];
                }
            } else {
                const newMetaModels = [];
                const metaModelId = metaModel.id;
                for (let i = 0, len = metaObject.metaModels.length; i < len; i++) {
                    if (metaObject.metaModels[i].id !== metaModelId) {
                        newMetaModels.push(metaObject.metaModels[i]);
                    }
                }
                metaObject.metaModels = newMetaModels;
            }
        }
    }

    // Re-link entire MetaObject parent/child hierarchy

    for (let objectId in this.metaObjects) {
        const metaObject = this.metaObjects[objectId];
        if (metaObject.children) {
            metaObject.children = [];
        }

        // Re-link each MetaObject's property sets

        if (metaObject.propertySets) {
            metaObject.propertySets = [];
        }
        if (metaObject.propertySetIds) {
            for (let i = 0, len = metaObject.propertySetIds.length; i < len; i++) {
                const propertySetId = metaObject.propertySetIds[i];
                const propertySet = this.propertySets[propertySetId];
                metaObject.propertySets.push(propertySet);
            }
        }
    }

    this.metaObjectsByType = {};

    for (let objectId in this.metaObjects) {
        const metaObject = this.metaObjects[objectId];
        const type = metaObject.type;
        if (metaObject.children) {
            metaObject.children = null;
        }
        (this.metaObjectsByType[type] || (this.metaObjectsByType[type] = {}))[objectId] = metaObject;
    }

    for (let objectId in this.metaObjects) {
        const metaObject = this.metaObjects[objectId];
        if (metaObject.parentId) {
            const parentMetaObject = this.metaObjects[metaObject.parentId];
            if (parentMetaObject) {
                metaObject.parent = parentMetaObject;
                (parentMetaObject.children || (parentMetaObject.children = [])).push(metaObject);
            }
        }
    }

    delete this.metaModels[id];

    this.fire("metaModelDestroyed", id);
}
