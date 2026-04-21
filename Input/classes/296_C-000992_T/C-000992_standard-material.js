class StandardMaterial extends Material {
    static TEXTURE_PARAMETERS = standardMaterialTextureParameters;

    static CUBEMAP_PARAMETERS = standardMaterialCubemapParameters;

    /**
     * Create a new StandardMaterial instance.
     *
     * @example
     * // Create a new Standard material
     * const material = new pc.StandardMaterial();
     *
     * // Update the material's diffuse and specular properties
     * material.diffuse.set(1, 0, 0);
     * material.specular.set(1, 1, 1);
     *
     * // Notify the material that it has been modified
     * material.update();
     * @example
     * // Create a new Standard material
     * const material = new pc.StandardMaterial();
     *
     * // Assign a texture to the diffuse slot
     * material.diffuseMap = texture;
     *
     * // Use the alpha channel of the texture for alpha testing with a reference value of 0.5
     * material.opacityMap = texture;
     * material.alphaTest = 0.5;
     *
     * // Notify the material that it has been modified
     * material.update();
     */
    constructor() {
        super();

        this._dirtyShader = true;

        // storage for texture and cubemap asset references
        this._assetReferences = {};

        this._activeParams = new Set();
        this._activeLightingParams = new Set();

        this.shaderOptBuilder = new StandardMaterialOptionsBuilder();

        this.reset();
    }

    reset() {
        // set default values
        Object.keys(_props).forEach((name) => {
            this[`_${name}`] = _props[name].value();
        });

        /**
         * @type {Object<string, string>}
         * @private
         */
        this._chunks = { };
        this._uniformCache = { };
    }

    set shader(shader) {
        Debug.warn('StandardMaterial#shader property is not implemented, and should not be used.');
    }

    get shader() {
        Debug.warn('StandardMaterial#shader property is not implemented, and should not be used.');
        return null;
    }

    /**
     * Object containing custom shader chunks that will replace default ones.
     *
     * @type {Object<string, string>}
     */
    set chunks(value) {
        this._dirtyShader = true;
        this._chunks = value;
    }

    get chunks() {
        this._dirtyShader = true;
        return this._chunks;
    }

    /**
     * Copy a `StandardMaterial`.
     *
     * @param {StandardMaterial} source - The material to copy from.
     * @returns {StandardMaterial} The destination material.
     */
    copy(source) {
        super.copy(source);

        // set properties
        Object.keys(_props).forEach((k) => {
            this[k] = source[k];
        });

        // clone chunks
        for (const p in source._chunks) {
            if (source._chunks.hasOwnProperty(p))
                this._chunks[p] = source._chunks[p];
        }

        return this;
    }

    _setParameter(name, value) {
        _params.add(name);
        this.setParameter(name, value);
    }

    _setParameters(parameters) {
        parameters.forEach((v) => {
            this._setParameter(v.name, v.value);
        });
    }

    _processParameters(paramsName) {
        const prevParams = this[paramsName];
        prevParams.forEach((param) => {
            if (!_params.has(param)) {
                delete this.parameters[param];
            }
        });

        this[paramsName] = _params;
        _params = prevParams;
        _params.clear();
    }

    _updateMap(p) {
        const mname = p + 'Map';
        const map = this[mname];
        if (map) {
            this._setParameter('texture_' + mname, map);

            const tname = mname + 'Transform';
            const uniform = this.getUniform(tname);
            if (uniform) {
                this._setParameters(uniform);
            }
        }
    }

    // allocate a uniform if it doesn't already exist in the uniform cache
    _allocUniform(name, allocFunc) {
        let uniform = this._uniformCache[name];
        if (!uniform) {
            uniform = allocFunc();
            this._uniformCache[name] = uniform;
        }
        return uniform;
    }

    getUniform(name, device, scene) {
        return _uniforms[name](this, device, scene);
    }

    updateUniforms(device, scene) {
        const getUniform = (name) => {
            return this.getUniform(name, device, scene);
        };

        this._setParameter('material_ambient', getUniform('ambient'));

        if (!this.diffuseMap || this.diffuseTint) {
            this._setParameter('material_diffuse', getUniform('diffuse'));
        }

        if (this.useMetalness) {
            if (!this.metalnessMap || this.metalness < 1) {
                this._setParameter('material_metalness', this.metalness);
            }
            if (!this.specularMap || this.specularTint) {
                this._setParameter('material_specular', getUniform('specular'));
            }
            if (!this.specularityFactorMap || this.specularityFactorTint) {
                this._setParameter('material_specularityFactor', this.specularityFactor);
            }
            if (!this.sheenMap || this.sheenTint) {
                this._setParameter('material_sheen', getUniform('sheen'));
            }
            if (!this.sheenGlossMap || this.sheenGlossTint) {
                this._setParameter('material_sheenGloss', this.sheenGloss);
            }

            this._setParameter('material_refractionIndex', this.refractionIndex);
        } else {
            if (!this.specularMap || this.specularTint) {
                this._setParameter('material_specular', getUniform('specular'));
            }
        }

        if (this.enableGGXSpecular) {
            this._setParameter('material_anisotropy', this.anisotropy);
        }

        if (this.clearCoat > 0) {
            this._setParameter('material_clearCoat', this.clearCoat);
            this._setParameter('material_clearCoatGloss', this.clearCoatGloss);
            this._setParameter('material_clearCoatBumpiness', this.clearCoatBumpiness);
        }

        this._setParameter('material_gloss', getUniform('gloss'));

        if (!this.emissiveMap || this.emissiveTint) {
            this._setParameter('material_emissive', getUniform('emissive'));
        }
        if (this.emissiveIntensity !== 1) {
            this._setParameter('material_emissiveIntensity', this.emissiveIntensity);
        }

        if (this.refraction > 0) {
            this._setParameter('material_refraction', this.refraction);
        }

        if (this.useDynamicRefraction) {
            this._setParameter('material_thickness', this.thickness);
            this._setParameter('material_attenuation', getUniform('attenuation'));
            this._setParameter('material_invAttenuationDistance', this.attenuationDistance === 0 ? 0 : 1.0 / this.attenuationDistance);
        }

        if (this.useIridescence) {
            this._setParameter('material_iridescence', this.iridescence);
            this._setParameter('material_iridescenceRefractionIndex', this.iridescenceRefractionIndex);
            this._setParameter('material_iridescenceThicknessMin', this.iridescenceThicknessMin);
            this._setParameter('material_iridescenceThicknessMax', this.iridescenceThicknessMax);
        }

        this._setParameter('material_opacity', this.opacity);

        if (this.opacityFadesSpecular === false) {
            this._setParameter('material_alphaFade', this.alphaFade);
        }

        if (this.occludeSpecular) {
            this._setParameter('material_occludeSpecularIntensity', this.occludeSpecularIntensity);
        }

        if (this.cubeMapProjection === CUBEPROJ_BOX) {
            this._setParameter(getUniform('cubeMapProjectionBox'));
        }

        for (const p in _matTex2D) {
            this._updateMap(p);
        }

        if (this.ambientSH) {
            this._setParameter('ambientSH[0]', this.ambientSH);
        }

        if (this.normalMap) {
            this._setParameter('material_bumpiness', this.bumpiness);
        }

        if (this.normalMap && this.normalDetailMap) {
            this._setParameter('material_normalDetailMapBumpiness', this.normalDetailMapBumpiness);
        }

        if (this.heightMap) {
            this._setParameter('material_heightMapFactor', getUniform('heightMapFactor'));
        }

        const isPhong = this.shadingModel === SPECULAR_PHONG;

        // set overridden environment textures
        if (this.envAtlas && this.cubeMap && !isPhong) {
            this._setParameter('texture_envAtlas', this.envAtlas);
            this._setParameter('texture_cubeMap', this.cubeMap);
        } else if (this.envAtlas && !isPhong) {
            this._setParameter('texture_envAtlas', this.envAtlas);
        } else if (this.cubeMap) {
            this._setParameter('texture_cubeMap', this.cubeMap);
        } else if (this.sphereMap) {
            this._setParameter('texture_sphereMap', this.sphereMap);
        }

        this._setParameter('material_reflectivity', this.reflectivity);

        // remove unused params
        this._processParameters('_activeParams');

        if (this._dirtyShader) {
            this.clearVariants();
        }
    }

    updateEnvUniforms(device, scene) {
        const isPhong = this.shadingModel === SPECULAR_PHONG;
        const hasLocalEnvOverride = (this.envAtlas && !isPhong) || this.cubeMap || this.sphereMap;

        if (!hasLocalEnvOverride && this.useSkybox) {
            if (scene.envAtlas && scene.skybox && !isPhong) {
                this._setParameter('texture_envAtlas', scene.envAtlas);
                this._setParameter('texture_cubeMap', scene.skybox);
            } else if (scene.envAtlas && !isPhong) {
                this._setParameter('texture_envAtlas', scene.envAtlas);
            } else if (scene.skybox) {
                this._setParameter('texture_cubeMap', scene.skybox);
            }
        }

        this._processParameters('_activeLightingParams');
    }

    getShaderVariant(device, scene, objDefs, unused, pass, sortedLights, viewUniformFormat, viewBindGroupFormat, vertexFormat) {

        // update prefiltered lighting data
        this.updateEnvUniforms(device, scene);

        // Minimal options for Depth and Shadow passes
        const shaderPassInfo = ShaderPass.get(device).getByIndex(pass);
        const minimalOptions = pass === SHADER_DEPTH || pass === SHADER_PICK || shaderPassInfo.isShadow;
        let options = minimalOptions ? standard.optionsContextMin : standard.optionsContext;

        if (minimalOptions)
            this.shaderOptBuilder.updateMinRef(options, scene, this, objDefs, pass, sortedLights);
        else
            this.shaderOptBuilder.updateRef(options, scene, this, objDefs, pass, sortedLights);

        // execute user callback to modify the options
        if (this.onUpdateShader) {
            options = this.onUpdateShader(options);
        }

        const processingOptions = new ShaderProcessorOptions(viewUniformFormat, viewBindGroupFormat, vertexFormat);

        const library = getProgramLibrary(device);
        library.register('standard', standard);
        const shader = library.getProgram('standard', options, processingOptions, this.userId);

        this._dirtyShader = false;
        return shader;
    }

    /**
     * Removes this material from the scene and possibly frees up memory from its shaders (if there
     * are no other materials using it).
     */
    destroy() {
        // unbind (texture) asset references
        for (const asset in this._assetReferences) {
            this._assetReferences[asset]._unbind();
        }
        this._assetReferences = null;

        super.destroy();
    }
}
