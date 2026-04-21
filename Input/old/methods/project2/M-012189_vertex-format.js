constructor(graphicsDevice, description, vertexCount) {
    this.device = graphicsDevice;
    this._elements = [];
    this.hasUv0 = false;
    this.hasUv1 = false;
    this.hasColor = false;
    this.hasTangents = false;
    this.verticesByteSize = 0;
    this.vertexCount = vertexCount;
    this.interleaved = vertexCount === undefined;

    // true if the vertex format represents an instancing vertex buffer
    this.instancing = false;

    // calculate total size of the vertex
    this.size = description.reduce((total, desc) => {
        return total + Math.ceil(desc.components * typedArrayTypesByteSize[desc.type] / 4) * 4;
    }, 0);

    let offset = 0, elementSize;
    for (let i = 0, len = description.length; i < len; i++) {
        const elementDesc = description[i];

        elementSize = elementDesc.components * typedArrayTypesByteSize[elementDesc.type];

        // WebGPU has limited element size support (for example uint16x3 is not supported)
        Debug.assert(!graphicsDevice.isWebGPU || [2, 4, 8, 12, 16].includes(elementSize),
                     `WebGPU does not support the format of vertex element ${elementDesc.semantic} : ${vertexTypesNames[elementDesc.type]} x ${elementDesc.components}`);

        // align up the offset to elementSize (when vertexCount is specified only - case of non-interleaved format)
        if (vertexCount) {
            offset = math.roundUp(offset, elementSize);

            // non-interleaved format with elementSize not multiple of 4 might be slower on some platforms - padding is recommended to align its size
            // example: use 4 x TYPE_UINT8 instead of 3 x TYPE_UINT8
            Debug.assert((elementSize % 4) === 0,
                         `Non-interleaved vertex format with element size not multiple of 4 can have performance impact on some platforms. Element size: ${elementSize}`);
        }

        const element = {
            name: elementDesc.semantic,
            offset: (vertexCount ? offset : (elementDesc.hasOwnProperty('offset') ? elementDesc.offset : offset)),
            stride: (vertexCount ? elementSize : (elementDesc.hasOwnProperty('stride') ? elementDesc.stride : this.size)),
            dataType: elementDesc.type,
            numComponents: elementDesc.components,
            normalize: elementDesc.normalize ?? false,
            size: elementSize
        };
        this._elements.push(element);

        if (vertexCount) {
            offset += elementSize * vertexCount;
        } else {
            offset += Math.ceil(elementSize / 4) * 4;
        }

        if (elementDesc.semantic === SEMANTIC_TEXCOORD0) {
            this.hasUv0 = true;
        } else if (elementDesc.semantic === SEMANTIC_TEXCOORD1) {
            this.hasUv1 = true;
        } else if (elementDesc.semantic === SEMANTIC_COLOR) {
            this.hasColor = true;
        } else if (elementDesc.semantic === SEMANTIC_TANGENT) {
            this.hasTangents = true;
        }
    }

    if (vertexCount) {
        this.verticesByteSize = offset;
    }

    this._evaluateHash();
}
