_buildVertexShader() {

    const scene = this._scene;
    const sectionPlanesState = scene._sectionPlanesState;
    const lightsState = scene._lightsState;
    const clipping = sectionPlanesState.sectionPlanes.length > 0;
    const clippingCaps = sectionPlanesState.clippingCaps;

    const src = [];

    src.push("// Triangles dataTexture quality draw vertex shader");

    if (scene.logarithmicDepthBufferEnabled && WEBGL_INFO.SUPPORTED_EXTENSIONS["EXT_frag_depth"]) {
        src.push("#extension GL_EXT_frag_depth : enable");
    }

    src.push("uniform int renderPass;");

    src.push("attribute vec3 position;");
    src.push("attribute vec3 normal;");
    src.push("attribute vec4 color;");
    src.push("attribute vec2 metallicRoughness;");
    src.push("attribute vec4 flags;");
    src.push("attribute vec4 flags2;");

    if (scene.entityOffsetsEnabled) {
        src.push("attribute vec3 offset;");
    }

    src.push("uniform mat4 worldMatrix;");
    src.push("uniform mat4 worldNormalMatrix;");

    src.push("uniform mat4 viewMatrix;");
    src.push("uniform mat4 projMatrix;");
    src.push("uniform mat4 viewNormalMatrix;");
    src.push("uniform mat4 positionsDecodeMatrix;");

    if (scene.logarithmicDepthBufferEnabled) {
        src.push("uniform float logDepthBufFC;");
        if (WEBGL_INFO.SUPPORTED_EXTENSIONS["EXT_frag_depth"]) {
            src.push("varying float vFragDepth;");
        }
        src.push("bool isPerspectiveMatrix(mat4 m) {");
        src.push("    return (m[2][3] == - 1.0);");
        src.push("}");
        src.push("varying float isPerspective;");
    }

    src.push("vec3 octDecode(vec2 oct) {");
    src.push("    vec3 v = vec3(oct.xy, 1.0 - abs(oct.x) - abs(oct.y));");
    src.push("    if (v.z < 0.0) {");
    src.push("        v.xy = (1.0 - abs(v.yx)) * vec2(v.x >= 0.0 ? 1.0 : -1.0, v.y >= 0.0 ? 1.0 : -1.0);");
    src.push("    }");
    src.push("    return normalize(v);");
    src.push("}");

    src.push("varying vec4 vViewPosition;");
    src.push("varying vec3 vViewNormal;");
    src.push("varying vec4 vColor;");
    src.push("varying vec2 vMetallicRoughness;");

    if (lightsState.lightMaps.length > 0) {
        src.push("varying vec3 vWorldNormal;");
    }

    if (clipping) {
        src.push("varying vec4 vWorldPosition;");
        src.push("varying vec4 vFlags2;");
        if (clippingCaps) {
            src.push("varying vec4 vClipPosition;");
        }
    }

    src.push("void main(void) {");

    // flags.x = NOT_RENDERED | COLOR_OPAQUE | COLOR_TRANSPARENT
    // renderPass = COLOR_OPAQUE

    src.push(`if (int(flags.x) != renderPass) {`);
    src.push("   gl_Position = vec4(0.0, 0.0, 0.0, 0.0);"); // Cull vertex

    src.push("} else {");

    src.push("vec4 worldPosition = worldMatrix * (positionsDecodeMatrix * vec4(position, 1.0)); ");
    if (scene.entityOffsetsEnabled) {
        src.push("worldPosition.xyz = worldPosition.xyz + offset;");
    }
    src.push("vec4 viewPosition  = viewMatrix * worldPosition; ");
    src.push("vec4 worldNormal =  worldNormalMatrix * vec4(octDecode(normal.xy), 0.0); ");
    src.push("vec3 viewNormal = normalize((viewNormalMatrix * worldNormal).xyz);");

    src.push("vec4 clipPos = projMatrix * viewPosition;");
    if (scene.logarithmicDepthBufferEnabled) {
        src.push("isPerspective = float (isPerspectiveMatrix(projMatrix));");
        if (WEBGL_INFO.SUPPORTED_EXTENSIONS["EXT_frag_depth"]) {
            src.push("vFragDepth = 1.0 + clipPos.w;");
        } else {
            src.push("clipPos.z = log2( max( 1e-6, clipPos.w + 1.0 ) ) * logDepthBufFC - 1.0;");
            src.push("clipPos.z *= clipPos.w;");
        }
    }

    if (clipping) {
        src.push("vWorldPosition = worldPosition;");
        src.push("vFlags2 = flags2;");
        if (clippingCaps) {
            src.push("vClipPosition = clipPos;");
        }
    }

    src.push("vViewPosition = viewPosition;");
    src.push("vViewNormal = viewNormal;");
    src.push("vColor = color;");
    src.push("vMetallicRoughness = metallicRoughness;");

    if (lightsState.lightMaps.length > 0) {
        src.push("vWorldNormal = worldNormal.xyz;");
    }

    src.push("gl_Position = clipPos;");
    src.push("}");

    src.push("}");
    return src;
}
