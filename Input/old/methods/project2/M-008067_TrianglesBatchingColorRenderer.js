_buildVertexShader() {
    const scene = this._scene;
    const sectionPlanesState = scene._sectionPlanesState;
    const lightsState = scene._lightsState;
    const clipping = sectionPlanesState.sectionPlanes.length > 0;
    let light;
    const src = [];
    src.push("#version 300 es");
    src.push("// Triangles batching draw vertex shader");

    src.push("uniform int renderPass;");

    src.push("in vec3 position;");
    src.push("in vec3 normal;");
    src.push("in vec4 color;");
    src.push("in float flags;");

    if (scene.entityOffsetsEnabled) {
        src.push("in vec3 offset;");
    }

    this._addMatricesUniformBlockLines(src, true);

    if (scene.logarithmicDepthBufferEnabled) {
        src.push("uniform float logDepthBufFC;");
        src.push("out float vFragDepth;");
        src.push("bool isPerspectiveMatrix(mat4 m) {");
        src.push("    return (m[2][3] == - 1.0);");
        src.push("}");
        src.push("out float isPerspective;");
    }

    src.push("uniform vec4 lightAmbient;");

    for (let i = 0, len = lightsState.lights.length; i < len; i++) {
        light = lightsState.lights[i];
        if (light.type === "ambient") {
            continue;
        }
        src.push("uniform vec4 lightColor" + i + ";");
        if (light.type === "dir") {
            src.push("uniform vec3 lightDir" + i + ";");
        }
        if (light.type === "point") {
            src.push("uniform vec3 lightPos" + i + ";");
        }
        if (light.type === "spot") {
            src.push("uniform vec3 lightPos" + i + ";");
            src.push("uniform vec3 lightDir" + i + ";");
        }
    }

    src.push("vec3 octDecode(vec2 oct) {");
    src.push("    vec3 v = vec3(oct.xy, 1.0 - abs(oct.x) - abs(oct.y));");
    src.push("    if (v.z < 0.0) {");
    src.push("        v.xy = (1.0 - abs(v.yx)) * vec2(v.x >= 0.0 ? 1.0 : -1.0, v.y >= 0.0 ? 1.0 : -1.0);");
    src.push("    }");
    src.push("    return normalize(v);");
    src.push("}");

    if (clipping) {
        src.push("out vec4 vWorldPosition;");
        src.push("out float vFlags;");
    }
    src.push("out vec4 vColor;");

    src.push("void main(void) {");

    // colorFlag = NOT_RENDERED | COLOR_OPAQUE | COLOR_TRANSPARENT
    // renderPass = COLOR_OPAQUE

    src.push(`int colorFlag = int(flags) & 0xF;`);
    src.push(`if (colorFlag != renderPass) {`);
    src.push("   gl_Position = vec4(0.0, 0.0, 0.0, 0.0);"); // Cull vertex

    src.push("} else {");

    src.push("vec4 worldPosition = worldMatrix * (positionsDecodeMatrix * vec4(position, 1.0)); ");
    if (scene.entityOffsetsEnabled) {
        src.push("worldPosition.xyz = worldPosition.xyz + offset;");
    }
    src.push("vec4 viewPosition  = viewMatrix * worldPosition; ");

    src.push("vec4 worldNormal =  worldNormalMatrix * vec4(octDecode(normal.xy), 0.0); ");

    src.push("vec3 viewNormal = normalize((viewNormalMatrix * worldNormal).xyz);");

    src.push("vec3 reflectedColor = vec3(0.0, 0.0, 0.0);");
    src.push("vec3 viewLightDir = vec3(0.0, 0.0, -1.0);");

    src.push("float lambertian = 1.0;");
    for (let i = 0, len = lightsState.lights.length; i < len; i++) {
        light = lightsState.lights[i];
        if (light.type === "ambient") {
            continue;
        }
        if (light.type === "dir") {
            if (light.space === "view") {
                src.push("viewLightDir = normalize(lightDir" + i + ");");
            } else {
                src.push("viewLightDir = normalize((viewMatrix * vec4(lightDir" + i + ", 0.0)).xyz);");
            }
        } else if (light.type === "point") {
            if (light.space === "view") {
                src.push("viewLightDir = -normalize(lightPos" + i + " - viewPosition.xyz);");
            } else {
                src.push("viewLightDir = -normalize((viewMatrix * vec4(lightPos" + i + ", 0.0)).xyz);");
            }
        } else if (light.type === "spot") {
            if (light.space === "view") {
                src.push("viewLightDir = normalize(lightDir" + i + ");");
            } else {
                src.push("viewLightDir = normalize((viewMatrix * vec4(lightDir" + i + ", 0.0)).xyz);");
            }
        } else {
            continue;
        }
        src.push("lambertian = max(dot(-viewNormal, viewLightDir), 0.0);");
        src.push("reflectedColor += lambertian * (lightColor" + i + ".rgb * lightColor" + i + ".a);");
    }

    src.push("vec3 rgb = (vec3(float(color.r) / 255.0, float(color.g) / 255.0, float(color.b) / 255.0));");
    src.push("vColor =  vec4((lightAmbient.rgb * lightAmbient.a * rgb) + (reflectedColor * rgb), float(color.a) / 255.0);");

    src.push("vec4 clipPos = projMatrix * viewPosition;");
    if (scene.logarithmicDepthBufferEnabled) {
       src.push("vFragDepth = 1.0 + clipPos.w;");
        src.push("isPerspective = float (isPerspectiveMatrix(projMatrix));");
    }
    if (clipping) {
        src.push("vWorldPosition = worldPosition;");
        src.push("vFlags = flags;");
    }
    src.push("gl_Position = clipPos;");
    src.push("}");

    src.push("}");
    return src;
}
