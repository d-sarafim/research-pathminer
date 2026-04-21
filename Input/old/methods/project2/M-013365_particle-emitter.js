_allocate(numParticles) {
    const psysVertCount = numParticles * this.numParticleVerts;
    const psysIndexCount = numParticles * this.numParticleIndices;

    if ((this.vertexBuffer === undefined) || (this.vertexBuffer.getNumVertices() !== psysVertCount)) {
        // Create the particle vertex format
        if (!this.useCpu) {
            // GPU: XYZ = quad vertex position; W = INT: particle ID, FRAC: random factor
            const elements = [{
                semantic: SEMANTIC_ATTR0,
                components: 4,
                type: TYPE_FLOAT32
            }];
            if (this.useMesh) {
                elements.push({
                    semantic: SEMANTIC_ATTR1,
                    components: 2,
                    type: TYPE_FLOAT32
                });
            }
            const particleFormat = new VertexFormat(this.graphicsDevice, elements);

            this.vertexBuffer = new VertexBuffer(this.graphicsDevice, particleFormat, psysVertCount, BUFFER_DYNAMIC);
            this.indexBuffer = new IndexBuffer(this.graphicsDevice, INDEXFORMAT_UINT16, psysIndexCount);
        } else {
            const elements = [{
                semantic: SEMANTIC_ATTR0,
                components: 4,
                type: TYPE_FLOAT32
            }, {
                semantic: SEMANTIC_ATTR1,
                components: 4,
                type: TYPE_FLOAT32
            }, {
                semantic: SEMANTIC_ATTR2,
                components: 4,
                type: TYPE_FLOAT32
            }, {
                semantic: SEMANTIC_ATTR3,
                components: 1,
                type: TYPE_FLOAT32
            }, {
                semantic: SEMANTIC_ATTR4,
                components: this.useMesh ? 4 : 2,
                type: TYPE_FLOAT32
            }];
            const particleFormat = new VertexFormat(this.graphicsDevice, elements);

            this.vertexBuffer = new VertexBuffer(this.graphicsDevice, particleFormat, psysVertCount, BUFFER_DYNAMIC);
            this.indexBuffer = new IndexBuffer(this.graphicsDevice, INDEXFORMAT_UINT16, psysIndexCount);
        }

        // Fill the vertex buffer
        const data = new Float32Array(this.vertexBuffer.lock());
        let meshData, stride, texCoordOffset;
        if (this.useMesh) {
            meshData = new Float32Array(this.mesh.vertexBuffer.lock());
            stride = meshData.length / this.mesh.vertexBuffer.numVertices;
            for (let elem = 0; elem < this.mesh.vertexBuffer.format.elements.length; elem++) {
                if (this.mesh.vertexBuffer.format.elements[elem].name === SEMANTIC_TEXCOORD0) {
                    texCoordOffset = this.mesh.vertexBuffer.format.elements[elem].offset / 4;
                    break;
                }
            }
        }

        for (let i = 0; i < psysVertCount; i++) {
            const id = Math.floor(i / this.numParticleVerts);
            if (!this.useMesh) {
                const vertID = i % 4;
                data[i * 4] = particleVerts[vertID][0];
                data[i * 4 + 1] = particleVerts[vertID][1];
                data[i * 4 + 2] = 0;
                data[i * 4 + 3] = id;
            } else {
                const vert = i % this.numParticleVerts;
                data[i * 6] = meshData[vert * stride];
                data[i * 6 + 1] = meshData[vert * stride + 1];
                data[i * 6 + 2] = meshData[vert * stride + 2];
                data[i * 6 + 3] = id;
                data[i * 6 + 4] = meshData[vert * stride + texCoordOffset + 0];
                data[i * 6 + 5] = 1.0 - meshData[vert * stride + texCoordOffset + 1];
            }
        }

        if (this.useCpu) {
            this.vbCPU = new Float32Array(data);
            this.vbOld = new Float32Array(this.vbCPU.length);
        }
        this.vertexBuffer.unlock();
        if (this.useMesh) {
            this.mesh.vertexBuffer.unlock();
        }

        // Fill the index buffer
        let dst = 0;
        const indices = new Uint16Array(this.indexBuffer.lock());
        if (this.useMesh) meshData = new Uint16Array(this.mesh.indexBuffer[0].lock());
        for (let i = 0; i < numParticles; i++) {
            if (!this.useMesh) {
                const baseIndex = i * 4;
                indices[dst++] = baseIndex;
                indices[dst++] = baseIndex + 1;
                indices[dst++] = baseIndex + 2;
                indices[dst++] = baseIndex;
                indices[dst++] = baseIndex + 2;
                indices[dst++] = baseIndex + 3;
            } else {
                for (let j = 0; j < this.numParticleIndices; j++) {
                    indices[i * this.numParticleIndices + j] = meshData[j] + i * this.numParticleVerts;
                }
            }
        }
        this.indexBuffer.unlock();
        if (this.useMesh) this.mesh.indexBuffer[0].unlock();
    }
}
