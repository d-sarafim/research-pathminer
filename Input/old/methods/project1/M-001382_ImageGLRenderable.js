drawTinImage(image, vertices, texCoords, indices, opacity) {
    const gl = this.gl;
    this.loadTexture(image);
    gl.uniformMatrix4fv(this.program['u_matrix'], false, this.getMap().projViewMatrix);
    gl.uniform1f(this.program['u_opacity'], opacity);

    //bufferdata vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    this.enableVertexAttrib(['a_position', 3]);
    //TODO save buffer to avoid repeatedly bufferData
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    //bufferdata tex coords
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
    this.enableVertexAttrib(['a_texCoord', 2]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.DYNAMIC_DRAW);

    //bufferdata indices
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);
    //draw
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}
