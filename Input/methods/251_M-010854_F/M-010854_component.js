_resolveEntityScriptAttribute(attribute, attributeName, oldValue, useGuid, newAttributes, duplicatedIdsMap) {
    if (attribute.array) {
        // handle entity array attribute
        const len = oldValue.length;
        if (!len) {
            return;
        }

        const newGuidArray = oldValue.slice();
        for (let i = 0; i < len; i++) {
            const guid = newGuidArray[i] instanceof Entity ? newGuidArray[i].getGuid() : newGuidArray[i];
            if (duplicatedIdsMap[guid]) {
                newGuidArray[i] = useGuid ? duplicatedIdsMap[guid].getGuid() : duplicatedIdsMap[guid];
            }
        }

        newAttributes[attributeName] = newGuidArray;
    } else {
        // handle regular entity attribute
        if (oldValue instanceof Entity) {
            oldValue = oldValue.getGuid();
        } else if (typeof oldValue !== 'string') {
            return;
        }

        if (duplicatedIdsMap[oldValue]) {
            newAttributes[attributeName] = duplicatedIdsMap[oldValue];
        }
    }
}
