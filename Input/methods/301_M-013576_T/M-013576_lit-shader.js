_fsGetShadowPassCode() {
    const device = this.device;
    const options = this.options;
    const chunks = this.chunks;
    const varyings = this.varyings;

    const lightType = this.shaderPassInfo.lightType;
    let shadowType = this.shaderPassInfo.shadowType;

    // If not a directional light and using clustered, fall back to using PCF3x3 if shadow type isn't supported
    if (lightType !== LIGHTTYPE_DIRECTIONAL && options.clusteredLightingEnabled) {
        if (shadowType === SHADOW_VSM8 || shadowType === SHADOW_VSM16 || shadowType === SHADOW_VSM32 || shadowType === SHADOW_PCSS) {
            shadowType = SHADOW_PCF3;
        }
    }

    let code = this._fsGetBeginCode();

    if (device.extStandardDerivatives && !device.webgl2 && !device.isWebGPU) {
        code += 'uniform vec2 polygonOffset;\n';
    }

    if (shadowType === SHADOW_VSM32) {
        if (device.textureFloatHighPrecision) {
            code += '#define VSM_EXPONENT 15.0\n\n';
        } else {
            code += '#define VSM_EXPONENT 5.54\n\n';
        }
    } else if (shadowType === SHADOW_VSM16) {
        code += '#define VSM_EXPONENT 5.54\n\n';
    }

    if (lightType !== LIGHTTYPE_DIRECTIONAL) {
        code += 'uniform vec3 view_position;\n';
        code += 'uniform float light_radius;\n';
    }

    code += varyings;
    code += this.varyingDefines;
    code += this.frontendDecl;
    code += this.frontendCode;

    const mayPackDepth = shadowType === SHADOW_PCF1 || shadowType === SHADOW_PCF3 || shadowType === SHADOW_PCF5 || shadowType === SHADOW_PCSS;
    const mustPackDepth = (lightType === LIGHTTYPE_OMNI && shadowType !== SHADOW_PCSS && !options.clusteredLightingEnabled);
    const usePackedDepth = mayPackDepth && !device.supportsDepthShadow || mustPackDepth;
    if (usePackedDepth) {
        code += chunks.packDepthPS;
    } else if (shadowType === SHADOW_VSM8) {
        code += "vec2 encodeFloatRG( float v ) {\n";
        code += "    vec2 enc = vec2(1.0, 255.0) * v;\n";
        code += "    enc = fract(enc);\n";
        code += "    enc -= enc.yy * vec2(1.0/255.0, 1.0/255.0);\n";
        code += "    return enc;\n";
        code += "}\n\n";
    }

    if (shadowType === SHADOW_PCSS) {
        code += shaderChunks.linearizeDepthPS;
    }

    code += ShaderGenerator.begin();

    code += this.frontendFunc;

    const isVsm = shadowType === SHADOW_VSM8 || shadowType === SHADOW_VSM16 || shadowType === SHADOW_VSM32;
    const applySlopeScaleBias = !device.webgl2 && device.extStandardDerivatives && !device.isWebGPU;

    // Use perspective depth for:
    // Directional: Always since light has no position
    // Spot: If not using VSM
    // Point: Never
    const usePerspectiveDepth = lightType === LIGHTTYPE_DIRECTIONAL || (!isVsm && lightType === LIGHTTYPE_SPOT);

    // Flag if we are using non-standard depth, i.e gl_FragCoord.z
    let hasModifiedDepth = false;
    if (usePerspectiveDepth) {
        code += "    float depth = gl_FragCoord.z;\n";
    } else {
        code += "    float depth = min(distance(view_position, vPositionW) / light_radius, 0.99999);\n";
        hasModifiedDepth = true;
    }

    if (applySlopeScaleBias) {
        code += "    float minValue = 2.3374370500153186e-10; //(1.0 / 255.0) / (256.0 * 256.0 * 256.0);\n";
        code += "    depth += polygonOffset.x * max(abs(dFdx(depth)), abs(dFdy(depth))) + minValue * polygonOffset.y;\n";
        hasModifiedDepth = true;
    }

    if (usePackedDepth) {
        code += "    gl_FragColor = packFloat(depth);\n";
    } else if (!isVsm) {
        const exportR32 = shadowType === SHADOW_PCSS;

        if (exportR32) {
            code += "    gl_FragColor.r = depth;\n";
        } else {

            // If we end up using modified depth, it needs to be explicitly written to gl_FragDepth
            if (hasModifiedDepth) {
                code += "    gl_FragDepth = depth;\n";
            }
            code += "    gl_FragColor = vec4(1.0);\n"; // just the simplest code, color is not written anyway
        }
    } else if (shadowType === SHADOW_VSM8) {
        code += "    gl_FragColor = vec4(encodeFloatRG(depth), encodeFloatRG(depth*depth));\n";
    } else {
        code += chunks.storeEVSMPS;
    }

    code += ShaderGenerator.end();

    return code;
}
