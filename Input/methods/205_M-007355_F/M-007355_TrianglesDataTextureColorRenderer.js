_buildFragmentShader() {
    const scene = this._scene;
    const sectionPlanesState = scene._sectionPlanesState;
    const clipping = sectionPlanesState.sectionPlanes.length > 0;
    const src = [];
    src.push ('#version 300 es');
    src.push("// Triangles dataTexture draw fragment shader");
    src.push("#ifdef GL_FRAGMENT_PRECISION_HIGH");
    src.push("precision highp float;");
    src.push("precision highp int;");
    src.push("#else");
    src.push("precision mediump float;");
    src.push("precision mediump int;");
    src.push("#endif");

    if (scene.logarithmicDepthBufferEnabled) {
        src.push("in float isPerspective;");
        src.push("uniform float logDepthBufFC;");
        src.push("in float vFragDepth;");
    }

    if (this._withSAO) {
        src.push("uniform sampler2D uOcclusionTexture;");
        src.push("uniform vec4      uSAOParams;");

        src.push("const float       packUpscale = 256. / 255.;");
        src.push("const float       unpackDownScale = 255. / 256.;");
        src.push("const vec3        packFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );");
        src.push("const vec4        unPackFactors = unpackDownScale / vec4( packFactors, 1. );");

        src.push("float unpackRGBToFloat( const in vec4 v ) {");
        src.push("    return dot( v, unPackFactors );");
        src.push("}");
    }
    if (clipping) {
        src.push("in vec4 vWorldPosition;");
        src.push("flat in uint vFlags2;");
        for (let i = 0, len = sectionPlanesState.sectionPlanes.length; i < len; i++) {
            src.push("uniform bool sectionPlaneActive" + i + ";");
            src.push("uniform vec3 sectionPlanePos" + i + ";");
            src.push("uniform vec3 sectionPlaneDir" + i + ";");
        }
    }
    src.push("in vec4 vColor;");
    src.push("out vec4 outColor;");
    src.push("void main(void) {");

    if (clipping) {
        src.push("  bool clippable = vFlags2 > 0u;");
        src.push("  if (clippable) {");
        src.push("  float dist = 0.0;");
        for (let i = 0, len = sectionPlanesState.sectionPlanes.length; i < len; i++) {
            src.push("if (sectionPlaneActive" + i + ") {");
            src.push("   dist += clamp(dot(-sectionPlaneDir" + i + ".xyz, vWorldPosition.xyz - sectionPlanePos" + i + ".xyz), 0.0, 1000.0);");
            src.push("}");
        }
            src.push("  if (dist > 0.0) { ");
            src.push("      discard;")
            src.push("  }");
        src.push("}");
    }

    if (scene.logarithmicDepthBufferEnabled) {
        // src.push("    gl_FragDepth = isPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;");
        src.push("    gl_FragDepth = log2( vFragDepth ) * logDepthBufFC * 0.5;");
    }

    if (this._withSAO) {
        // Doing SAO blend in the main solid fill draw shader just so that edge lines can be drawn over the top
        // Would be more efficient to defer this, then render lines later, using same depth buffer for Z-reject
        src.push("   float viewportWidth     = uSAOParams[0];");
        src.push("   float viewportHeight    = uSAOParams[1];");
        src.push("   float blendCutoff       = uSAOParams[2];");
        src.push("   float blendFactor       = uSAOParams[3];");
        src.push("   vec2 uv                 = vec2(gl_FragCoord.x / viewportWidth, gl_FragCoord.y / viewportHeight);");
        src.push("   float ambient           = smoothstep(blendCutoff, 1.0, unpackRGBToFloat(texture(uOcclusionTexture, uv))) * blendFactor;");
        src.push("   outColor            = vec4(vColor.rgb * ambient, 1.0);");
    } else {
        src.push("   outColor            = vColor;");
    }

    src.push("}");
    return src;
}
