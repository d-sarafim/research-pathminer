initializeComponentData(component, data, properties) {
    component._beingInitialized = true;

    if (data.anchor !== undefined) {
        if (data.anchor instanceof Vec4) {
            component.anchor.copy(data.anchor);
        } else {
            component.anchor.set(data.anchor[0], data.anchor[1], data.anchor[2], data.anchor[3]);
        }
    }

    if (data.pivot !== undefined) {
        if (data.pivot instanceof Vec2) {
            component.pivot.copy(data.pivot);
        } else {
            component.pivot.set(data.pivot[0], data.pivot[1]);
        }
    }

    const splitHorAnchors = Math.abs(component.anchor.x - component.anchor.z) > 0.001;
    const splitVerAnchors = Math.abs(component.anchor.y - component.anchor.w) > 0.001;
    let _marginChange = false;
    let color;

    if (data.margin !== undefined) {
        if (data.margin instanceof Vec4) {
            component.margin.copy(data.margin);
        } else {
            component._margin.set(data.margin[0], data.margin[1], data.margin[2], data.margin[3]);
        }

        _marginChange = true;
    }

    if (data.left !== undefined) {
        component._margin.x = data.left;
        _marginChange = true;
    }
    if (data.bottom !== undefined) {
        component._margin.y = data.bottom;
        _marginChange = true;
    }
    if (data.right !== undefined) {
        component._margin.z = data.right;
        _marginChange = true;
    }
    if (data.top !== undefined) {
        component._margin.w = data.top;
        _marginChange = true;
    }
    if (_marginChange) {
        // force update
        component.margin = component._margin;
    }

    let shouldForceSetAnchor = false;

    if (data.width !== undefined && !splitHorAnchors) {
        // force update
        component.width = data.width;
    } else if (splitHorAnchors) {
        shouldForceSetAnchor = true;
    }
    if (data.height !== undefined && !splitVerAnchors) {
        // force update
        component.height = data.height;
    } else if (splitVerAnchors) {
        shouldForceSetAnchor = true;
    }

    if (shouldForceSetAnchor) {
        /* eslint-disable no-self-assign */
        // force update
        component.anchor = component.anchor;
        /* eslint-enable no-self-assign */
    }

    if (data.enabled !== undefined) {
        component.enabled = data.enabled;
    }

    if (data.useInput !== undefined) {
        component.useInput = data.useInput;
    }

    if (data.fitMode !== undefined) {
        component.fitMode = data.fitMode;
    }

    component.batchGroupId = data.batchGroupId === undefined || data.batchGroupId === null ? -1 : data.batchGroupId;

    if (data.layers && Array.isArray(data.layers)) {
        component.layers = data.layers.slice(0);
    }

    if (data.type !== undefined) {
        component.type = data.type;
    }

    if (component.type === ELEMENTTYPE_IMAGE) {
        if (data.rect !== undefined) {
            component.rect = data.rect;
        }
        if (data.color !== undefined) {
            color = data.color;
            if (!(color instanceof Color)) {
                color = new Color(data.color[0], data.color[1], data.color[2]);
            }
            component.color = color;
        }

        if (data.opacity !== undefined) component.opacity = data.opacity;
        if (data.textureAsset !== undefined) component.textureAsset = data.textureAsset;
        if (data.texture) component.texture = data.texture;
        if (data.spriteAsset !== undefined) component.spriteAsset = data.spriteAsset;
        if (data.sprite) component.sprite = data.sprite;
        if (data.spriteFrame !== undefined) component.spriteFrame = data.spriteFrame;
        if (data.pixelsPerUnit !== undefined && data.pixelsPerUnit !== null) component.pixelsPerUnit = data.pixelsPerUnit;
        if (data.materialAsset !== undefined) component.materialAsset = data.materialAsset;
        if (data.material) component.material = data.material;

        if (data.mask !== undefined) {
            component.mask = data.mask;
        }
    } else if (component.type === ELEMENTTYPE_TEXT) {
        if (data.autoWidth !== undefined) component.autoWidth = data.autoWidth;
        if (data.autoHeight !== undefined) component.autoHeight = data.autoHeight;
        if (data.rtlReorder !== undefined) component.rtlReorder = data.rtlReorder;
        if (data.unicodeConverter !== undefined) component.unicodeConverter = data.unicodeConverter;
        if (data.text !== null && data.text !== undefined) {
            component.text = data.text;
        } else if (data.key !== null && data.key !== undefined) {
            component.key = data.key;
        }
        if (data.color !== undefined) {
            color = data.color;
            if (!(color instanceof Color)) {
                color = new Color(color[0], color[1], color[2]);
            }
            component.color = color;
        }
        if (data.opacity !== undefined) {
            component.opacity = data.opacity;
        }
        if (data.spacing !== undefined) component.spacing = data.spacing;
        if (data.fontSize !== undefined) {
            component.fontSize = data.fontSize;
            if (!data.lineHeight) component.lineHeight = data.fontSize;
        }
        if (data.lineHeight !== undefined) component.lineHeight = data.lineHeight;
        if (data.maxLines !== undefined) component.maxLines = data.maxLines;
        if (data.wrapLines !== undefined) component.wrapLines = data.wrapLines;
        if (data.minFontSize !== undefined) component.minFontSize = data.minFontSize;
        if (data.maxFontSize !== undefined) component.maxFontSize = data.maxFontSize;
        if (data.autoFitWidth) component.autoFitWidth = data.autoFitWidth;
        if (data.autoFitHeight) component.autoFitHeight = data.autoFitHeight;
        if (data.fontAsset !== undefined) component.fontAsset = data.fontAsset;
        if (data.font !== undefined) component.font = data.font;
        if (data.alignment !== undefined) component.alignment = data.alignment;
        if (data.outlineColor !== undefined) component.outlineColor = data.outlineColor;
        if (data.outlineThickness !== undefined) component.outlineThickness = data.outlineThickness;
        if (data.shadowColor !== undefined) component.shadowColor = data.shadowColor;
        if (data.shadowOffset !== undefined) component.shadowOffset = data.shadowOffset;
        if (data.enableMarkup !== undefined) component.enableMarkup = data.enableMarkup;
    }
    // OTHERWISE: group

    // find screen
    // do this here not in constructor so that component is added to the entity
    const result = component._parseUpToScreen();
    if (result.screen) {
        component._updateScreen(result.screen);
    }

    super.initializeComponentData(component, data, properties);

    component._beingInitialized = false;

    if (component.type === ELEMENTTYPE_IMAGE && component._image._meshDirty) {
        component._image._updateMesh(component._image.mesh);
    }
}
