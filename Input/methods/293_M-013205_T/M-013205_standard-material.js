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
