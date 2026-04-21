generateVertexShader(useUv, useUnmodifiedUv, mapTransforms) {
    const device = this.device;
    const options = this.options;
    const chunks = this.chunks;

    let code = '';
    let codeBody = '';

    // code += chunks.baseVS;
    code = this._vsAddBaseCode(code, chunks, options);

    codeBody += "   vPositionW    = getWorldPosition();\n";

    if (this.options.pass === SHADER_DEPTH) {
        code += 'varying float vDepth;\n';
        code += '#ifndef VIEWMATRIX\n';
        code += '#define VIEWMATRIX\n';
        code += 'uniform mat4 matrix_view;\n';
        code += '#endif\n';
        code += '#ifndef CAMERAPLANES\n';
        code += '#define CAMERAPLANES\n';
        code += 'uniform vec4 camera_params;\n\n';
        code += '#endif\n';
        codeBody += "    vDepth = -(matrix_view * vec4(vPositionW,1.0)).z * camera_params.x;\n";
    }

    if (this.options.useInstancing) {
        this.attributes.instance_line1 = SEMANTIC_ATTR12;
        this.attributes.instance_line2 = SEMANTIC_ATTR13;
        this.attributes.instance_line3 = SEMANTIC_ATTR14;
        this.attributes.instance_line4 = SEMANTIC_ATTR15;
        code += chunks.instancingVS;
    }

    if (this.needsNormal) {
        this.attributes.vertex_normal = SEMANTIC_NORMAL;
        codeBody += "   vNormalW = getNormal();\n";

        if (options.reflectionSource === 'sphereMap' && device.fragmentUniformsCount <= 16) {
            code += chunks.viewNormalVS;
            codeBody += "   vNormalV    = getViewNormal();\n";
        }

        if (options.hasTangents && (options.useHeights || options.useNormals || options.enableGGXSpecular)) {
            this.attributes.vertex_tangent = SEMANTIC_TANGENT;
            code += chunks.tangentBinormalVS;
            codeBody += "   vTangentW   = getTangent();\n";
            codeBody += "   vBinormalW  = getBinormal();\n";
        } else if (options.enableGGXSpecular || !device.extStandardDerivatives) {
            codeBody += "   vObjectSpaceUpW = normalize(dNormalMatrix * vec3(0, 1, 0));\n";
        }
    }

    const maxUvSets = 2;

    for (let i = 0; i < maxUvSets; i++) {
        if (useUv[i]) {
            this.attributes["vertex_texCoord" + i] = "TEXCOORD" + i;
            code += chunks["uv" + i + "VS"];
            codeBody += "   vec2 uv" + i + " = getUv" + i + "();\n";
        }
        if (useUnmodifiedUv[i]) {
            codeBody += "   vUv" + i + " = uv" + i + ";\n";
        }
    }

    const codes = [code, this.varyings, codeBody, []];

    mapTransforms.forEach((mapTransform) => {
        this._setMapTransform(codes, mapTransform.name, mapTransform.id, mapTransform.uv);
    });

    code = codes[0];
    this.varyings = codes[1];
    codeBody = codes[2];

    if (options.vertexColors) {
        this.attributes.vertex_color = SEMANTIC_COLOR;
        codeBody += "   vVertexColor = vertex_color;\n";
    }

    if (options.useMsdf && options.msdfTextAttribute) {
        this.attributes.vertex_outlineParameters = SEMANTIC_ATTR8;
        this.attributes.vertex_shadowParameters = SEMANTIC_ATTR9;

        codeBody += "    unpackMsdfParams();\n";

        code += chunks.msdfVS;
    }

    // morphing
    if (options.useMorphPosition || options.useMorphNormal) {

        if (options.useMorphTextureBased) {

            code += "#define MORPHING_TEXTURE_BASED\n";

            if (options.useMorphPosition) {
                code += "#define MORPHING_TEXTURE_BASED_POSITION\n";
            }

            if (options.useMorphNormal) {
                code += "#define MORPHING_TEXTURE_BASED_NORMAL\n";
            }

            // vertex ids attributes
            this.attributes.morph_vertex_id = SEMANTIC_ATTR15;
            const morphIdType = device.isWebGPU ? 'uint' : 'float';
            code += `attribute ${morphIdType} morph_vertex_id;\n`;

        } else {

            // set up 8 slots for morphing. these are supported combinations: PPPPPPPP, NNNNNNNN, PPPPNNNN
            code += "#define MORPHING\n";

            // first 4 slots are either position or normal
            if (options.useMorphPosition) {
                this.attributes.morph_pos0 = SEMANTIC_ATTR8;
                this.attributes.morph_pos1 = SEMANTIC_ATTR9;
                this.attributes.morph_pos2 = SEMANTIC_ATTR10;
                this.attributes.morph_pos3 = SEMANTIC_ATTR11;

                code += "#define MORPHING_POS03\n";
                code += "attribute vec3 morph_pos0;\n";
                code += "attribute vec3 morph_pos1;\n";
                code += "attribute vec3 morph_pos2;\n";
                code += "attribute vec3 morph_pos3;\n";

            } else if (options.useMorphNormal) {
                this.attributes.morph_nrm0 = SEMANTIC_ATTR8;
                this.attributes.morph_nrm1 = SEMANTIC_ATTR9;
                this.attributes.morph_nrm2 = SEMANTIC_ATTR10;
                this.attributes.morph_nrm3 = SEMANTIC_ATTR11;

                code += "#define MORPHING_NRM03\n";
                code += "attribute vec3 morph_nrm0;\n";
                code += "attribute vec3 morph_nrm1;\n";
                code += "attribute vec3 morph_nrm2;\n";
                code += "attribute vec3 morph_nrm3;\n";
            }

            // next 4 slots are either position or normal
            if (!options.useMorphNormal) {
                this.attributes.morph_pos4 = SEMANTIC_ATTR12;
                this.attributes.morph_pos5 = SEMANTIC_ATTR13;
                this.attributes.morph_pos6 = SEMANTIC_ATTR14;
                this.attributes.morph_pos7 = SEMANTIC_ATTR15;

                code += "#define MORPHING_POS47\n";
                code += "attribute vec3 morph_pos4;\n";
                code += "attribute vec3 morph_pos5;\n";
                code += "attribute vec3 morph_pos6;\n";
                code += "attribute vec3 morph_pos7;\n";
            } else {
                this.attributes.morph_nrm4 = SEMANTIC_ATTR12;
                this.attributes.morph_nrm5 = SEMANTIC_ATTR13;
                this.attributes.morph_nrm6 = SEMANTIC_ATTR14;
                this.attributes.morph_nrm7 = SEMANTIC_ATTR15;

                code += "#define MORPHING_NRM47\n";
                code += "attribute vec3 morph_nrm4;\n";
                code += "attribute vec3 morph_nrm5;\n";
                code += "attribute vec3 morph_nrm6;\n";
                code += "attribute vec3 morph_nrm7;\n";
            }
        }
    }

    if (options.skin) {
        this.attributes.vertex_boneWeights = SEMANTIC_BLENDWEIGHT;
        this.attributes.vertex_boneIndices = SEMANTIC_BLENDINDICES;
        code += ShaderGenerator.skinCode(device, chunks);
        code += "#define SKIN\n";
    } else if (options.useInstancing) {
        code += "#define INSTANCING\n";
    }
    if (options.screenSpace) {
        code += "#define SCREENSPACE\n";
    }
    if (options.pixelSnap) {
        code += "#define PIXELSNAP\n";
    }

    code = this._vsAddTransformCode(code, device, chunks, options);

    if (this.needsNormal) {
        code += chunks.normalVS;
    }

    code += "\n";
    code += chunks.startVS;
    code += codeBody;
    code += chunks.endVS;
    code += "}";

    // build varyings
    Object.keys(builtinVaryings).forEach((v) => {
        if (code.indexOf(v) >= 0) {
            this.varyings += `varying ${builtinVaryings[v]} ${v};\n`;
            this.varyingDefines += `#define VARYING_${v.toUpperCase()}\n`;
        }
    });

    const shaderPassDefines = this.shaderPassInfo.shaderDefines;
    this.vshader = shaderPassDefines + this.varyings + code;
}
