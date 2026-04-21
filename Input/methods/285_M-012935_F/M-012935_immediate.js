getTextureShader() {
    return this.getShader('textureShader', `
        varying vec2 uv0;
        uniform sampler2D colorMap;
        void main (void) {
            gl_FragColor = vec4(texture2D(colorMap, uv0).xyz, 1);
        }
    `);
}
