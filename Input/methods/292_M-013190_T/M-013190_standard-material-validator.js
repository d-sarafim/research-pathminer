validate(data) {
    // validate input data against defined standard-material properties and types\
    // if removeInvalid flag is set to true then remove invalid properties from data

    const TYPES = standardMaterialParameterTypes;
    const REMOVED = standardMaterialRemovedParameters;

    const pathMapping = (data.mappingFormat === 'path');

    for (const key in data) {
        const type = TYPES[key];

        if (!type) {
            if (REMOVED[key]) {
                delete data[key];
            } else {
                Debug.warnOnce(`Ignoring unsupported input property to standard material: ${key}`);
                this.valid = false;
            }
            continue;
        }

        if (type.startsWith('enum')) {
            const enumType = type.split(':')[1];
            if (this.enumValidators[enumType]) {
                if (!this.enumValidators[enumType](data[key])) {
                    this.setInvalid(key, data);
                }
            }

        } else if (type === 'number') {
            if (typeof data[key] !== 'number') {
                this.setInvalid(key, data);
            }
        } else if (type === 'boolean') {
            if (typeof data[key] !== 'boolean') {
                this.setInvalid(key, data);
            }
        } else if (type === 'string') {
            if (typeof data[key] !== 'string') {
                this.setInvalid(key, data);
            }
        } else if (type === 'vec2') {
            if (!(data[key] instanceof Array && data[key].length === 2)) {
                this.setInvalid(key, data);
            }
        } else if (type === 'rgb') {
            if (!(data[key] instanceof Array && data[key].length === 3)) {
                this.setInvalid(key, data);
            }
        } else if (type === 'texture') {
            if (!pathMapping) {
                if (!(typeof data[key] === 'number' || data[key] === null)) {
                    if (!(data[key] instanceof Texture)) {
                        this.setInvalid(key, data);
                    }
                }
                // OTHERWISE: materials are often initialized with the asset id of textures which are assigned later
                // this counts as a valid input
                // null texture reference is also valid
            } else {
                if (!(typeof data[key] === 'string' || data[key] === null)) {
                    if (!(data[key] instanceof Texture)) {
                        this.setInvalid(key, data);
                    }
                }
                // OTHERWISE: fpr path mapped we expect a string not an asset id
            }
        } else if (type === 'boundingbox') {
            if (!(data[key].center && data[key].center instanceof Array && data[key].center.length === 3)) {
                this.setInvalid(key, data);
            }
            if (!(data[key].halfExtents && data[key].halfExtents instanceof Array && data[key].halfExtents.length === 3)) {
                this.setInvalid(key, data);
            }
        } else if (type === 'cubemap') {
            if (!(typeof data[key] === 'number' || data[key] === null || data[key] === undefined)) {

                if (!(data[key] instanceof Texture && data[key].cubemap)) {
                    this.setInvalid(key, data);
                }
            }
            // OTHERWISE: materials are often initialized with the asset id of textures which are assigned later
            // this counts as a valid input
            // null texture reference is also valid
        } else if (type === 'chunks') {
            const chunkNames = Object.keys(data[key]);
            for (let i = 0; i < chunkNames.length; i++) {
                if (typeof data[key][chunkNames[i]] !== 'string') {
                    this.setInvalid(chunkNames[i], data[key]);
                }
            }

        } else {
            console.error('Unknown material type: ' + type);
        }
    }

    // mark data as validated so we don't validate twice
    data.validated = true;

    return this.valid;
}
