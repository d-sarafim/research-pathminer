_updateText(text) {
    let tags;

    if (text === undefined) text = this._text;

    // get the list of symbols
    // NOTE: we must normalize text here in order to be consistent with the number of
    // symbols returned from the bidi algorithm. If we don't, then in some cases bidi
    // returns a different number of RTL codes to what we expect.
    // NOTE: IE doesn't support string.normalize(), so we must check for its existence
    // before invoking.
    this._symbols = string.getSymbols(text.normalize ? text.normalize('NFC') : text);

    // handle null string
    if (this._symbols.length === 0) {
        this._symbols = [' '];
    }

    // extract markup
    if (this._enableMarkup) {
        const results = Markup.evaluate(this._symbols);
        this._symbols = results.symbols;
        // NOTE: if results.tags is null, we assign [] to increase
        // probability of batching. So, if a user want to use as less
        // WebGL buffers memory as possible they can just disable markups.
        tags = results.tags || [];
    }

    // handle LTR vs RTL ordering
    if (this._rtlReorder) {
        const rtlReorderFunc = this._system.app.systems.element.getRtlReorder();
        if (rtlReorderFunc) {
            const results = rtlReorderFunc(this._symbols);

            this._rtl = results.rtl;

            // reorder symbols according to unicode reorder mapping
            this._symbols = results.mapping.map(function (v) {
                return this._symbols[v];
            }, this);

            // reorder tags if they exist, according to unicode reorder mapping
            if (tags) {
                tags = results.mapping.map(function (v) {
                    return tags[v];
                });
            }
        } else {
            console.warn('Element created with rtlReorder option but no rtlReorder function registered');
        }
    } else {
        this._rtl = false;
    }

    const getColorThicknessHash = (color, thickness) => {
        return `${color.toString(true).toLowerCase()}:${
            thickness.toFixed(2)
        }`;
    };

    const getColorOffsetHash = (color, offset) => {
        return `${color.toString(true).toLowerCase()}:${
            offset.x.toFixed(2)
        }:${
            offset.y.toFixed(2)
        }`;
    };

    // resolve color, outline, and shadow tags
    if (tags) {
        const paletteMap = { };
        const outlinePaletteMap = { };
        const shadowPaletteMap = { };

        // store fallback color in the palette
        this._colorPalette = [
            Math.round(this._color.r * 255),
            Math.round(this._color.g * 255),
            Math.round(this._color.b * 255)
        ];
        this._outlinePalette = [
            Math.round(this._outlineColor.r * 255),
            Math.round(this._outlineColor.g * 255),
            Math.round(this._outlineColor.b * 255),
            Math.round(this._outlineColor.a * 255),
            Math.round(this._outlineThickness * 255)
        ];
        this._shadowPalette = [
            Math.round(this._shadowColor.r * 255),
            Math.round(this._shadowColor.g * 255),
            Math.round(this._shadowColor.b * 255),
            Math.round(this._shadowColor.a * 255),
            Math.round(this._shadowOffset.x * 127),
            Math.round(this._shadowOffset.y * 127)
        ];

        this._symbolColors = [];
        this._symbolOutlineParams = [];
        this._symbolShadowParams = [];

        paletteMap[this._color.toString(false).toLowerCase()] = 0;
        outlinePaletteMap[
            getColorThicknessHash(this._outlineColor, this._outlineThickness)
        ] = 0;
        shadowPaletteMap[
            getColorOffsetHash(this._shadowColor, this._shadowOffset)
        ] = 0;

        for (let i = 0, len = this._symbols.length; i < len; ++i) {
            const tag = tags[i];
            let color = 0;

            // get markup coloring
            if (tag && tag.color && tag.color.value) {
                const c = tag.color.value;

                // resolve color dictionary names
                // TODO: implement the dictionary of colors
                // if (colorDict.hasOwnProperty(c)) {
                //    c = dict[c];
                // }

                // convert hex color
                if (c.length === 7 && c[0] === '#') {
                    const hex = c.substring(1).toLowerCase();

                    if (paletteMap.hasOwnProperty(hex)) {
                        // color is already in the palette
                        color = paletteMap[hex];
                    } else {
                        if (/^([0-9a-f]{2}){3}$/.test(hex)) {
                            // new color
                            color = this._colorPalette.length / 3;
                            paletteMap[hex] = color;
                            this._colorPalette.push(parseInt(hex.substring(0, 2), 16));
                            this._colorPalette.push(parseInt(hex.substring(2, 4), 16));
                            this._colorPalette.push(parseInt(hex.substring(4, 6), 16));
                        }
                    }
                }
            }
            this._symbolColors.push(color);

            let outline = 0;

            // get markup outline
            if (
                tag &&
                tag.outline &&
                (tag.outline.attributes.color || tag.outline.attributes.thickness)
            ) {
                let color = tag.outline.attributes.color ?
                    colorTmp.fromString(tag.outline.attributes.color) :
                    this._outlineColor;

                let thickness = Number(tag.outline.attributes.thickness);

                if (
                    Number.isNaN(color.r) ||
                    Number.isNaN(color.g) ||
                    Number.isNaN(color.b) ||
                    Number.isNaN(color.a)
                ) {
                    color = this._outlineColor;
                }

                if (Number.isNaN(thickness)) {
                    thickness = this._outlineThickness;
                }

                const outlineHash = getColorThicknessHash(color, thickness);

                if (outlinePaletteMap.hasOwnProperty(outlineHash)) {
                    // outline parameters is already in the palette
                    outline = outlinePaletteMap[outlineHash];
                } else {
                    // new outline parameter index, 5 ~ (r, g, b, a, thickness)
                    outline = this._outlinePalette.length / 5;
                    outlinePaletteMap[outlineHash] = outline;

                    this._outlinePalette.push(
                        Math.round(color.r * 255),
                        Math.round(color.g * 255),
                        Math.round(color.b * 255),
                        Math.round(color.a * 255),
                        Math.round(thickness * 255)
                    );
                }
            }

            this._symbolOutlineParams.push(outline);

            let shadow = 0;

            // get markup shadow
            if (tag && tag.shadow && (
                tag.shadow.attributes.color ||
                tag.shadow.attributes.offset ||
                tag.shadow.attributes.offsetX ||
                tag.shadow.attributes.offsetY
            )) {
                let color = tag.shadow.attributes.color ?
                    colorTmp.fromString(tag.shadow.attributes.color) :
                    this._shadowColor;

                const off = Number(tag.shadow.attributes.offset);
                const offX = Number(tag.shadow.attributes.offsetX);
                const offY = Number(tag.shadow.attributes.offsetY);

                if (
                    Number.isNaN(color.r) ||
                    Number.isNaN(color.g) ||
                    Number.isNaN(color.b) ||
                    Number.isNaN(color.a)
                ) {
                    color = this._shadowColor;
                }

                const offset = vec2Tmp.set(
                    !Number.isNaN(offX) ?
                        offX :
                        !Number.isNaN(off) ?
                            off :
                            this._shadowOffset.x,
                    !Number.isNaN(offY) ?
                        offY :
                        !Number.isNaN(off) ?
                            off :
                            this._shadowOffset.y
                );

                const shadowHash = getColorOffsetHash(color, offset);

                if (shadowPaletteMap.hasOwnProperty(shadowHash)) {
                    // shadow parameters is already in the palette
                    shadow = shadowPaletteMap[shadowHash];
                } else {
                    // new shadow parameter index, 6 ~ (r, g, b, a, offset.x, offset.y)
                    shadow = this._shadowPalette.length / 6;
                    shadowPaletteMap[shadowHash] = shadow;

                    this._shadowPalette.push(
                        Math.round(color.r * 255),
                        Math.round(color.g * 255),
                        Math.round(color.b * 255),
                        Math.round(color.a * 255),
                        Math.round(offset.x * 127),
                        Math.round(offset.y * 127)
                    );
                }
            }

            this._symbolShadowParams.push(shadow);
        }
    } else {
        // no tags, therefore no per-symbol colors
        this._colorPalette = [];
        this._symbolColors = null;
        this._symbolOutlineParams = null;
        this._symbolShadowParams = null;
    }

    this._updateMaterialEmissive();
    this._updateMaterialOutline();
    this._updateMaterialShadow();

    const charactersPerTexture = this._calculateCharsPerTexture();

    let removedModel = false;

    const element = this._element;
    const screenSpace = element._isScreenSpace();
    const screenCulled = element._isScreenCulled();
    const visibleFn = function (camera) {
        return element.isVisibleForCamera(camera);
    };

    for (let i = 0, len = this._meshInfo.length; i < len; i++) {
        const l = charactersPerTexture[i] || 0;
        const meshInfo = this._meshInfo[i];

        if (meshInfo.count !== l) {
            if (!removedModel) {
                element.removeModelFromLayers(this._model);
                removedModel = true;
            }

            meshInfo.count = l;
            meshInfo.positions.length = meshInfo.normals.length = l * 3 * 4;
            meshInfo.indices.length = l * 3 * 2;
            meshInfo.uvs.length = l * 2 * 4;
            meshInfo.colors.length = l * 4 * 4;
            meshInfo.outlines.length = l * 4 * 3;
            meshInfo.shadows.length = l * 4 * 3;

            // destroy old mesh
            if (meshInfo.meshInstance) {
                this._removeMeshInstance(meshInfo.meshInstance);
            }

            // if there are no letters for this mesh continue
            if (l === 0) {
                meshInfo.meshInstance = null;
                continue;
            }

            // set up indices and normals whose values don't change when we call _updateMeshes
            for (let v = 0; v < l; v++) {
                // create index and normal arrays since they don't change
                // if the length doesn't change
                meshInfo.indices[v * 3 * 2 + 0] = v * 4;
                meshInfo.indices[v * 3 * 2 + 1] = v * 4 + 1;
                meshInfo.indices[v * 3 * 2 + 2] = v * 4 + 3;
                meshInfo.indices[v * 3 * 2 + 3] = v * 4 + 2;
                meshInfo.indices[v * 3 * 2 + 4] = v * 4 + 3;
                meshInfo.indices[v * 3 * 2 + 5] = v * 4 + 1;

                meshInfo.normals[v * 4 * 3 + 0] = 0;
                meshInfo.normals[v * 4 * 3 + 1] = 0;
                meshInfo.normals[v * 4 * 3 + 2] = -1;

                meshInfo.normals[v * 4 * 3 + 3] = 0;
                meshInfo.normals[v * 4 * 3 + 4] = 0;
                meshInfo.normals[v * 4 * 3 + 5] = -1;

                meshInfo.normals[v * 4 * 3 + 6] = 0;
                meshInfo.normals[v * 4 * 3 + 7] = 0;
                meshInfo.normals[v * 4 * 3 + 8] = -1;

                meshInfo.normals[v * 4 * 3 + 9] = 0;
                meshInfo.normals[v * 4 * 3 + 10] = 0;
                meshInfo.normals[v * 4 * 3 + 11] = -1;
            }

            const mesh = createTextMesh(this._system.app.graphicsDevice, meshInfo);

            const mi = new MeshInstance(mesh, this._material, this._node);
            mi.name = 'Text Element: ' + this._entity.name;
            mi.castShadow = false;
            mi.receiveShadow = false;
            mi.cull = !screenSpace;
            mi.screenSpace = screenSpace;
            mi.drawOrder = this._drawOrder;

            if (screenCulled) {
                mi.cull = true;
                mi.isVisibleFunc = visibleFn;
            }

            this._setTextureParams(mi, this._font.textures[i]);

            mi.setParameter('material_emissive', this._colorUniform);
            mi.setParameter('material_opacity', this._color.a);
            mi.setParameter('font_sdfIntensity', this._font.intensity);
            mi.setParameter('font_pxrange', this._getPxRange(this._font));
            mi.setParameter('font_textureWidth', this._font.data.info.maps[i].width);

            mi.setParameter('outline_color', this._outlineColorUniform);
            mi.setParameter('outline_thickness', this._outlineThicknessScale * this._outlineThickness);

            mi.setParameter('shadow_color', this._shadowColorUniform);
            if (this._symbolShadowParams) {
                this._shadowOffsetUniform[0] = 0;
                this._shadowOffsetUniform[1] = 0;
            } else {
                const ratio = -this._font.data.info.maps[i].width / this._font.data.info.maps[i].height;
                this._shadowOffsetUniform[0] = this._shadowOffsetScale * this._shadowOffset.x;
                this._shadowOffsetUniform[1] = ratio * this._shadowOffsetScale * this._shadowOffset.y;
            }
            mi.setParameter('shadow_offset', this._shadowOffsetUniform);

            meshInfo.meshInstance = mi;

            this._model.meshInstances.push(mi);
        }
    }

    // after creating new meshes
    // re-apply masking stencil params
    if (this._element.maskedBy) {
        this._element._setMaskedBy(this._element.maskedBy);
    }

    if (removedModel && this._element.enabled && this._entity.enabled) {
        this._element.addModelToLayers(this._model);
    }

    this._updateMeshes();

    // update render range
    this._rangeStart = 0;
    this._rangeEnd = this._symbols.length;
    this._updateRenderRange();
}
