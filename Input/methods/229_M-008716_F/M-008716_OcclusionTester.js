_buildVertexShaderSource() {
    const scene = this._scene;
    const clipping = scene._sectionPlanesState.sectionPlanes.length > 0;
    const src = [];
    src.push("#version 300 es");
    src.push("// OcclusionTester vertex shader");
    
    src.push("in vec3 position;");
    src.push("uniform mat4 modelMatrix;");
    src.push("uniform mat4 viewMatrix;");
    src.push("uniform mat4 projMatrix;");
    if (scene.logarithmicDepthBufferEnabled) {
        src.push("uniform float logDepthBufFC;");
        src.push("out float vFragDepth;");
    }
    if (clipping) {
        src.push("out vec4 vWorldPosition;");
    }
    src.push("void main(void) {");
    src.push("vec4 worldPosition = vec4(position, 1.0); ");
    src.push("   vec4 viewPosition = viewMatrix * worldPosition;");
    if (clipping) {
        src.push("   vWorldPosition = worldPosition;");
    }
    src.push("   vec4 clipPos = projMatrix * viewPosition;");
    src.push("   gl_PointSize = " + POINT_SIZE + ".0;");
    if (scene.logarithmicDepthBufferEnabled) {
       src.push("vFragDepth = 1.0 + clipPos.w;");
    } else {
        src.push("clipPos.z += " + MARKER_SPRITE_CLIPZ_OFFSET + ";");
    }
    src.push("   gl_Position = clipPos;");
    src.push("}");
    return src;
}
