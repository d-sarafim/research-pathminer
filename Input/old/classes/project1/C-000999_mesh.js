class GeometryVertexStream {
    constructor(data, componentCount, dataType, dataTypeNormalize) {
        this.data = data;                           // array of data
        this.componentCount = componentCount;       // number of components
        this.dataType = dataType;                   // format of elements (pc.TYPE_FLOAT32 ..)
        this.dataTypeNormalize = dataTypeNormalize; // normalize element (divide by 255)
    }
}
