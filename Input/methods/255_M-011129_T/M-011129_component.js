_showFrame(frame) {
    if (!this.sprite) return;

    const mesh = this.sprite.meshes[frame];
    // if mesh is null then hide the mesh instance
    if (!mesh) {
        if (this._meshInstance) {
            this._meshInstance.mesh = null;
            this._meshInstance.visible = false;
        }

        return;
    }

    let material;
    if (this.sprite.renderMode === SPRITE_RENDERMODE_SLICED) {
        material = this.system.default9SlicedMaterialSlicedMode;
    } else if (this.sprite.renderMode === SPRITE_RENDERMODE_TILED) {
        material = this.system.default9SlicedMaterialTiledMode;
    } else {
        material = this.system.defaultMaterial;
    }

    // create mesh instance if it doesn't exist yet
    if (!this._meshInstance) {
        this._meshInstance = new MeshInstance(mesh, this._material, this._node);
        this._meshInstance.castShadow = false;
        this._meshInstance.receiveShadow = false;
        this._meshInstance.drawOrder = this._drawOrder;
        this._model.meshInstances.push(this._meshInstance);

        // set overrides on mesh instance
        this._colorUniform[0] = this._color.r;
        this._colorUniform[1] = this._color.g;
        this._colorUniform[2] = this._color.b;
        this._meshInstance.setParameter(PARAM_EMISSIVE, this._colorUniform);
        this._meshInstance.setParameter(PARAM_OPACITY, this._color.a);

        // now that we created the mesh instance, add the model to the scene
        if (this.enabled && this.entity.enabled) {
            this._showModel();
        }
    }

    // update material
    if (this._meshInstance.material !== material) {
        this._meshInstance.material = material;
    }

    // update mesh
    if (this._meshInstance.mesh !== mesh) {
        this._meshInstance.mesh = mesh;
        this._meshInstance.visible = true;
        // reset aabb
        this._meshInstance._aabbVer = -1;
    }

    // set texture params
    if (this.sprite.atlas && this.sprite.atlas.texture) {
        this._meshInstance.setParameter(PARAM_EMISSIVE_MAP, this.sprite.atlas.texture);
        this._meshInstance.setParameter(PARAM_OPACITY_MAP, this.sprite.atlas.texture);
    } else {
        // no texture so reset texture params
        this._meshInstance.deleteParameter(PARAM_EMISSIVE_MAP);
        this._meshInstance.deleteParameter(PARAM_OPACITY_MAP);
    }

    // for 9-sliced
    if (this.sprite.atlas && (this.sprite.renderMode === SPRITE_RENDERMODE_SLICED || this.sprite.renderMode === SPRITE_RENDERMODE_TILED)) {
        // set custom aabb function
        this._meshInstance._updateAabbFunc = this._updateAabbFunc;

        // calculate inner offset
        const frameData = this.sprite.atlas.frames[this.sprite.frameKeys[frame]];
        if (frameData) {
            const borderWidthScale = 2 / frameData.rect.z;
            const borderHeightScale = 2 / frameData.rect.w;

            this._innerOffset.set(
                frameData.border.x * borderWidthScale,
                frameData.border.y * borderHeightScale,
                frameData.border.z * borderWidthScale,
                frameData.border.w * borderHeightScale
            );

            const tex = this.sprite.atlas.texture;
            this._atlasRect.set(frameData.rect.x / tex.width,
                                frameData.rect.y / tex.height,
                                frameData.rect.z / tex.width,
                                frameData.rect.w / tex.height
            );

        } else {
            this._innerOffset.set(0, 0, 0, 0);
        }

        // set inner offset and atlas rect on mesh instance
        this._innerOffsetUniform[0] = this._innerOffset.x;
        this._innerOffsetUniform[1] = this._innerOffset.y;
        this._innerOffsetUniform[2] = this._innerOffset.z;
        this._innerOffsetUniform[3] = this._innerOffset.w;
        this._meshInstance.setParameter(PARAM_INNER_OFFSET, this._innerOffsetUniform);
        this._atlasRectUniform[0] = this._atlasRect.x;
        this._atlasRectUniform[1] = this._atlasRect.y;
        this._atlasRectUniform[2] = this._atlasRect.z;
        this._atlasRectUniform[3] = this._atlasRect.w;
        this._meshInstance.setParameter(PARAM_ATLAS_RECT, this._atlasRectUniform);
    } else {
        this._meshInstance._updateAabbFunc = null;
    }

    this._updateTransform();
}
