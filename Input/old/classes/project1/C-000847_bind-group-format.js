class BindTextureFormat {
    /** @type {import('./scope-id.js').ScopeId} */
    scopeId;

    constructor(name, visibility, textureDimension = TEXTUREDIMENSION_2D, sampleType = SAMPLETYPE_FLOAT) {
        /** @type {string} */
        this.name = name;

        // SHADERSTAGE_VERTEX, SHADERSTAGE_FRAGMENT, SHADERSTAGE_COMPUTE
        this.visibility = visibility;

        // TEXTUREDIMENSION_***
        this.textureDimension = textureDimension;

        // SAMPLETYPE_***
        this.sampleType = sampleType;
    }
}
