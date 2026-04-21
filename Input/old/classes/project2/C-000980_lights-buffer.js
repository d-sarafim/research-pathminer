class LightsBuffer {
    // format for high precision light texture - float
    static FORMAT_FLOAT = 0;

    // format for high precision light texture - 8bit
    static FORMAT_8BIT = 1;

    // active light texture format, initialized at app start
    static lightTextureFormat = LightsBuffer.FORMAT_8BIT;

    // on webgl2 we use texelFetch instruction to read data textures
    static useTexelFetch = false;

    // defines used for unpacking of light textures to allow CPU packing to match the GPU unpacking
    static shaderDefines = '';

    // creates list of defines specifying texture coordinates for decoding lights
    static initShaderDefines() {
        const clusterTextureFormat = LightsBuffer.lightTextureFormat === LightsBuffer.FORMAT_FLOAT ? 'FLOAT' : '8BIT';
        LightsBuffer.shaderDefines = `
            \n#define CLUSTER_TEXTURE_${clusterTextureFormat}
            ${LightsBuffer.buildShaderDefines(TextureIndex8, 'CLUSTER_TEXTURE_8_')}
            ${LightsBuffer.buildShaderDefines(TextureIndexFloat, 'CLUSTER_TEXTURE_F_')}
        `;
    }

    // converts object with properties to a list of these as an example: "#define CLUSTER_TEXTURE_8_BLAH 1.5"
    static buildShaderDefines(object, prefix) {
        let str = '';
        const floatOffset = LightsBuffer.useTexelFetch ? '' : '.5';
        Object.keys(object).forEach((key) => {
            str += `\n#define ${prefix}${key} ${object[key]}${floatOffset}`;
        });
        return str;
    }

    // executes when the app starts
    static init(device) {

        // precision for texture storage
        // don't use float texture on devices with small number of texture units (as it uses both float and 8bit textures at the same time)
        LightsBuffer.lightTextureFormat = (device.extTextureFloat && device.maxTextures > 8) ? LightsBuffer.FORMAT_FLOAT : LightsBuffer.FORMAT_8BIT;

        LightsBuffer.useTexelFetch = device.supportsTextureFetch;

        LightsBuffer.initShaderDefines();
    }

    static createTexture(device, width, height, format, name) {
        const tex = new Texture(device, {
            name: name,
            width: width,
            height: height,
            mipmaps: false,
            format: format,
            addressU: ADDRESS_CLAMP_TO_EDGE,
            addressV: ADDRESS_CLAMP_TO_EDGE,
            type: TEXTURETYPE_DEFAULT,
            magFilter: FILTER_NEAREST,
            minFilter: FILTER_NEAREST,
            anisotropy: 1
        });

        return tex;
    }

    constructor(device) {

        this.device = device;

        // features
        this.cookiesEnabled = false;
        this.shadowsEnabled = false;
        this.areaLightsEnabled = false;

        // using 8 bit index so this is maximum supported number of lights
        this.maxLights = 255;

        // shared 8bit texture pixels:
        let pixelsPerLight8 = TextureIndex8.COUNT_ALWAYS;
        let pixelsPerLightFloat = 0;

        // float texture format
        if (LightsBuffer.lightTextureFormat === LightsBuffer.FORMAT_FLOAT) {
            pixelsPerLightFloat = TextureIndexFloat.COUNT;
        } else { // 8bit texture
            pixelsPerLight8 = TextureIndex8.COUNT;
        }

        // 8bit texture - to store data that can fit into 8bits to lower the bandwidth requirements
        this.lights8 = new Uint8ClampedArray(4 * pixelsPerLight8 * this.maxLights);
        this.lightsTexture8 = LightsBuffer.createTexture(this.device, pixelsPerLight8, this.maxLights, PIXELFORMAT_RGBA8, 'LightsTexture8');
        this._lightsTexture8Id = this.device.scope.resolve('lightsTexture8');

        // float texture
        if (pixelsPerLightFloat) {
            this.lightsFloat = new Float32Array(4 * pixelsPerLightFloat * this.maxLights);
            this.lightsTextureFloat = LightsBuffer.createTexture(this.device, pixelsPerLightFloat, this.maxLights, PIXELFORMAT_RGBA32F, 'LightsTextureFloat');
            this._lightsTextureFloatId = this.device.scope.resolve('lightsTextureFloat');
        } else {
            this.lightsFloat = null;
            this.lightsTextureFloat = null;
            this._lightsTextureFloatId = undefined;
        }

        // inverse sizes for both textures
        this._lightsTextureInvSizeId = this.device.scope.resolve('lightsTextureInvSize');
        this._lightsTextureInvSizeData = new Float32Array(4);
        this._lightsTextureInvSizeData[0] = pixelsPerLightFloat ? 1.0 / this.lightsTextureFloat.width : 0;
        this._lightsTextureInvSizeData[1] = pixelsPerLightFloat ? 1.0 / this.lightsTextureFloat.height : 0;
        this._lightsTextureInvSizeData[2] = 1.0 / this.lightsTexture8.width;
        this._lightsTextureInvSizeData[3] = 1.0 / this.lightsTexture8.height;

        // compression ranges
        this.invMaxColorValue = 0;
        this.invMaxAttenuation = 0;
        this.boundsMin = new Vec3();
        this.boundsDelta = new Vec3();
    }

    destroy() {

        // release textures
        if (this.lightsTexture8) {
            this.lightsTexture8.destroy();
            this.lightsTexture8 = null;
        }

        if (this.lightsTextureFloat) {
            this.lightsTextureFloat.destroy();
            this.lightsTextureFloat = null;
        }
    }

    setCompressionRanges(maxAttenuation, maxColorValue) {
        this.invMaxColorValue = 1 / maxColorValue;
        this.invMaxAttenuation = 1 / maxAttenuation;
    }

    setBounds(min, delta) {
        this.boundsMin.copy(min);
        this.boundsDelta.copy(delta);
    }

    uploadTextures() {

        if (this.lightsTextureFloat) {
            this.lightsTextureFloat.lock().set(this.lightsFloat);
            this.lightsTextureFloat.unlock();
        }

        this.lightsTexture8.lock().set(this.lights8);
        this.lightsTexture8.unlock();
    }

    updateUniforms() {

        // textures
        this._lightsTexture8Id.setValue(this.lightsTexture8);

        if (LightsBuffer.lightTextureFormat === LightsBuffer.FORMAT_FLOAT) {
            this._lightsTextureFloatId.setValue(this.lightsTextureFloat);
        }

        this._lightsTextureInvSizeId.setValue(this._lightsTextureInvSizeData);
    }

    getSpotDirection(direction, spot) {

        // Spots shine down the negative Y axis
        const mat = spot._node.getWorldTransform();
        mat.getY(direction).mulScalar(-1);
        direction.normalize();
    }

    // half sizes of area light in world space, returned as an array of 6 floats
    getLightAreaSizes(light) {

        const mat = light._node.getWorldTransform();

        mat.transformVector(areaHalfAxisWidth, tempVec3);
        tempAreaLightSizes[0] = tempVec3.x;
        tempAreaLightSizes[1] = tempVec3.y;
        tempAreaLightSizes[2] = tempVec3.z;

        mat.transformVector(areaHalfAxisHeight, tempVec3);
        tempAreaLightSizes[3] = tempVec3.x;
        tempAreaLightSizes[4] = tempVec3.y;
        tempAreaLightSizes[5] = tempVec3.z;

        return tempAreaLightSizes;
    }

    addLightDataFlags(data8, index, light, isSpot, castShadows, shadowIntensity) {
        data8[index + 0] = isSpot ? 255 : 0;
        data8[index + 1] = light._shape * 64;           // value 0..3
        data8[index + 2] = light._falloffMode * 255;    // value 0..1
        data8[index + 3] = castShadows ? shadowIntensity * 255 : 0;
    }

    addLightDataColor(data8, index, light, gammaCorrection, isCookie) {
        const invMaxColorValue = this.invMaxColorValue;
        const color = gammaCorrection ? light._linearFinalColor : light._finalColor;
        FloatPacking.float2Bytes(color[0] * invMaxColorValue, data8, index + 0, 2);
        FloatPacking.float2Bytes(color[1] * invMaxColorValue, data8, index + 2, 2);
        FloatPacking.float2Bytes(color[2] * invMaxColorValue, data8, index + 4, 2);

        // cookie
        data8[index + 6] = isCookie ? 255 : 0;

        // lightMask
        // 0: MASK_AFFECT_DYNAMIC
        // 127: MASK_AFFECT_DYNAMIC && MASK_AFFECT_LIGHTMAPPED
        // 255: MASK_AFFECT_LIGHTMAPPED
        const isDynamic = !!(light.mask & MASK_AFFECT_DYNAMIC);
        const isLightmapped = !!(light.mask & MASK_AFFECT_LIGHTMAPPED);
        data8[index + 7] = (isDynamic && isLightmapped) ? 127 : (isLightmapped ? 255 : 0);
    }

    addLightDataSpotAngles(data8, index, light) {
        // 2 bytes each
        FloatPacking.float2Bytes(light._innerConeAngleCos * (0.5 - epsilon) + 0.5, data8, index + 0, 2);
        FloatPacking.float2Bytes(light._outerConeAngleCos * (0.5 - epsilon) + 0.5, data8, index + 2, 2);
    }

    addLightDataShadowBias(data8, index, light) {
        const lightRenderData = light.getRenderData(null, 0);
        const biases = light._getUniformBiasValues(lightRenderData);
        FloatPacking.float2BytesRange(biases.bias, data8, index, -1, 20, 2);  // bias: -1 to 20 range
        FloatPacking.float2Bytes(biases.normalBias, data8, index + 2, 2);     // normalBias: 0 to 1 range
    }

    addLightDataPositionRange(data8, index, light, pos) {
        // position and range scaled to 0..1 range
        const normPos = tempVec3.sub2(pos, this.boundsMin).div(this.boundsDelta);
        FloatPacking.float2Bytes(normPos.x, data8, index + 0, 4);
        FloatPacking.float2Bytes(normPos.y, data8, index + 4, 4);
        FloatPacking.float2Bytes(normPos.z, data8, index + 8, 4);
        FloatPacking.float2Bytes(light.attenuationEnd * this.invMaxAttenuation, data8, index + 12, 4);
    }

    addLightDataSpotDirection(data8, index, light) {
        this.getSpotDirection(tempVec3, light);
        FloatPacking.float2Bytes(tempVec3.x * (0.5 - epsilon) + 0.5, data8, index + 0, 4);
        FloatPacking.float2Bytes(tempVec3.y * (0.5 - epsilon) + 0.5, data8, index + 4, 4);
        FloatPacking.float2Bytes(tempVec3.z * (0.5 - epsilon) + 0.5, data8, index + 8, 4);
    }

    addLightDataLightProjMatrix(data8, index, lightProjectionMatrix) {
        const matData = lightProjectionMatrix.data;
        for (let m = 0; m < 12; m++)    // these are in -2..2 range
            FloatPacking.float2BytesRange(matData[m], data8, index + 4 * m, -2, 2, 4);
        for (let m = 12; m < 16; m++) {  // these are full float range
            FloatPacking.float2MantissaExponent(matData[m], data8, index + 4 * m, 4);
        }
    }

    addLightDataCookies(data8, index, light) {
        const isRgb = light._cookieChannel === 'rgb';
        data8[index + 0] = Math.floor(light.cookieIntensity * 255);
        data8[index + 1] = isRgb ? 255 : 0;
        // we have two unused bytes here

        if (!isRgb) {
            const channel = light._cookieChannel;
            data8[index + 4] = channel === 'rrr' ? 255 : 0;
            data8[index + 5] = channel === 'ggg' ? 255 : 0;
            data8[index + 6] = channel === 'bbb' ? 255 : 0;
            data8[index + 7] = channel === 'aaa' ? 255 : 0;
        }
    }

    addLightAtlasViewport(data8, index, atlasViewport) {
        // all these are in 0..1 range
        FloatPacking.float2Bytes(atlasViewport.x, data8, index + 0, 2);
        FloatPacking.float2Bytes(atlasViewport.y, data8, index + 2, 2);
        FloatPacking.float2Bytes(atlasViewport.z / 3, data8, index + 4, 2);
        // we have two unused bytes here
    }

    addLightAreaSizes(data8, index, light) {
        const areaSizes = this.getLightAreaSizes(light);
        for (let i = 0; i < 6; i++) {  // these are full float range
            FloatPacking.float2MantissaExponent(areaSizes[i], data8, index + 4 * i, 4);
        }
    }

    // fill up both float and 8bit texture data with light properties
    addLightData(light, lightIndex, gammaCorrection) {

        const isSpot = light._type === LIGHTTYPE_SPOT;
        const hasAtlasViewport = light.atlasViewportAllocated; // if the light does not have viewport, it does not fit to the atlas
        const isCookie = this.cookiesEnabled && !!light._cookie && hasAtlasViewport;
        const isArea = this.areaLightsEnabled && light.shape !== LIGHTSHAPE_PUNCTUAL;
        const castShadows = this.shadowsEnabled && light.castShadows && hasAtlasViewport;
        const pos = light._node.getPosition();

        let lightProjectionMatrix = null;   // light projection matrix - used for shadow map and cookie of spot light
        let atlasViewport = null;   // atlas viewport info - used for shadow map and cookie of omni light
        if (isSpot) {
            if (castShadows) {
                const lightRenderData = light.getRenderData(null, 0);
                lightProjectionMatrix = lightRenderData.shadowMatrix;
            } else if (isCookie) {
                lightProjectionMatrix = LightCamera.evalSpotCookieMatrix(light);
            }
        } else {
            if (castShadows || isCookie) {
                atlasViewport = light.atlasViewport;
            }
        }

        // data always stored in 8bit texture
        const data8 = this.lights8;
        const data8Start = lightIndex * this.lightsTexture8.width * 4;

        // flags
        this.addLightDataFlags(data8, data8Start + 4 * TextureIndex8.FLAGS, light, isSpot, castShadows, light.shadowIntensity);

        // light color
        this.addLightDataColor(data8, data8Start + 4 * TextureIndex8.COLOR_A, light, gammaCorrection, isCookie);

        // spot light angles
        if (isSpot) {
            this.addLightDataSpotAngles(data8, data8Start + 4 * TextureIndex8.SPOT_ANGLES, light);
        }

        // shadow biases
        if (light.castShadows) {
            this.addLightDataShadowBias(data8, data8Start + 4 * TextureIndex8.SHADOW_BIAS, light);
        }

        // cookie properties
        if (isCookie) {
            this.addLightDataCookies(data8, data8Start + 4 * TextureIndex8.COOKIE_A, light);
        }

        // high precision data stored using float texture
        if (LightsBuffer.lightTextureFormat === LightsBuffer.FORMAT_FLOAT) {

            const dataFloat = this.lightsFloat;
            const dataFloatStart = lightIndex * this.lightsTextureFloat.width * 4;

            // pos and range
            dataFloat[dataFloatStart + 4 * TextureIndexFloat.POSITION_RANGE + 0] = pos.x;
            dataFloat[dataFloatStart + 4 * TextureIndexFloat.POSITION_RANGE + 1] = pos.y;
            dataFloat[dataFloatStart + 4 * TextureIndexFloat.POSITION_RANGE + 2] = pos.z;
            dataFloat[dataFloatStart + 4 * TextureIndexFloat.POSITION_RANGE + 3] = light.attenuationEnd;

            // spot direction
            if (isSpot) {
                this.getSpotDirection(tempVec3, light);
                dataFloat[dataFloatStart + 4 * TextureIndexFloat.SPOT_DIRECTION + 0] = tempVec3.x;
                dataFloat[dataFloatStart + 4 * TextureIndexFloat.SPOT_DIRECTION + 1] = tempVec3.y;
                dataFloat[dataFloatStart + 4 * TextureIndexFloat.SPOT_DIRECTION + 2] = tempVec3.z;
                // here we have unused float
            }

            // light projection matrix
            if (lightProjectionMatrix) {
                const matData = lightProjectionMatrix.data;
                for (let m = 0; m < 16; m++)
                    dataFloat[dataFloatStart + 4 * TextureIndexFloat.PROJ_MAT_0 + m] = matData[m];
            }

            if (atlasViewport) {
                dataFloat[dataFloatStart + 4 * TextureIndexFloat.ATLAS_VIEWPORT + 0] = atlasViewport.x;
                dataFloat[dataFloatStart + 4 * TextureIndexFloat.ATLAS_VIEWPORT + 1] = atlasViewport.y;
                dataFloat[dataFloatStart + 4 * TextureIndexFloat.ATLAS_VIEWPORT + 2] = atlasViewport.z / 3; // size of a face slot (3x3 grid)
            }

            // area light sizes
            if (isArea) {
                const areaSizes = this.getLightAreaSizes(light);
                dataFloat[dataFloatStart + 4 * TextureIndexFloat.AREA_DATA_WIDTH + 0] = areaSizes[0];
                dataFloat[dataFloatStart + 4 * TextureIndexFloat.AREA_DATA_WIDTH + 1] = areaSizes[1];
                dataFloat[dataFloatStart + 4 * TextureIndexFloat.AREA_DATA_WIDTH + 2] = areaSizes[2];

                dataFloat[dataFloatStart + 4 * TextureIndexFloat.AREA_DATA_HEIGHT + 0] = areaSizes[3];
                dataFloat[dataFloatStart + 4 * TextureIndexFloat.AREA_DATA_HEIGHT + 1] = areaSizes[4];
                dataFloat[dataFloatStart + 4 * TextureIndexFloat.AREA_DATA_HEIGHT + 2] = areaSizes[5];
            }

        } else {    // high precision data stored using 8bit texture

            this.addLightDataPositionRange(data8, data8Start + 4 * TextureIndex8.POSITION_X, light, pos);

            // spot direction
            if (isSpot) {
                this.addLightDataSpotDirection(data8, data8Start + 4 * TextureIndex8.SPOT_DIRECTION_X, light);
            }

            // light projection matrix
            if (lightProjectionMatrix) {
                this.addLightDataLightProjMatrix(data8, data8Start + 4 * TextureIndex8.PROJ_MAT_00, lightProjectionMatrix);
            }

            if (atlasViewport) {
                this.addLightAtlasViewport(data8, data8Start + 4 * TextureIndex8.ATLAS_VIEWPORT_A, atlasViewport);
            }

            // area light sizes
            if (isArea) {
                this.addLightAreaSizes(data8, data8Start + 4 * TextureIndex8.AREA_DATA_WIDTH_X, light);
            }
        }
    }
}
