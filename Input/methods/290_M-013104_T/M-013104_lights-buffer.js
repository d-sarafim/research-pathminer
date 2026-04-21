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
