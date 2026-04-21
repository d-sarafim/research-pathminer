setCompressedData({mipmaps, props = {}}) {

    const gl = this.gl;
    const levels = mipmaps.length;

    // Cache props

    if (props.format !== undefined) {
        this.format = props.format;
    }
    if (props.internalFormat !== undefined) {
        this.internalFormat = props.internalFormat;
    }
    if (props.encoding !== undefined) {
        this.encoding = props.encoding;
    }
    if (props.type !== undefined) {
        this.type = props.type;
    }
    if (props.flipY !== undefined) {
        this.flipY = props.flipY;
    }
    if (props.premultiplyAlpha !== undefined) {
        this.premultiplyAlpha = props.premultiplyAlpha;
    }
    if (props.unpackAlignment !== undefined) {
        this.unpackAlignment = props.unpackAlignment;
    }
    if (props.minFilter !== undefined) {
        this.minFilter = props.minFilter;
    }
    if (props.magFilter !== undefined) {
        this.magFilter = props.magFilter;
    }
    if (props.wrapS !== undefined) {
        this.wrapS = props.wrapS;
    }
    if (props.wrapT !== undefined) {
        this.wrapT = props.wrapT;
    }
    if (props.wrapR !== undefined) {
        this.wrapR = props.wrapR;
    }

    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(this.target, this.texture);

    let supportsMips = mipmaps.length > 1;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, this.unpackAlignment);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

    const wrapS = convertConstant(gl, this.wrapS);
    if (wrapS) {
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, wrapS);
    }

    const wrapT = convertConstant(gl, this.wrapT);
    if (wrapT) {
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, wrapT);
    }

    if (this.type === gl.TEXTURE_3D || this.type === gl.TEXTURE_2D_ARRAY) {
        const wrapR = convertConstant(gl, this.wrapR);
        if (wrapR) {
            gl.texParameteri(this.target, gl.TEXTURE_WRAP_R, wrapR);
        }
        gl.texParameteri(this.type, gl.TEXTURE_WRAP_R, wrapR);
    }

    if (supportsMips) {
        gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, filterFallback(gl, this.minFilter));
        gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, filterFallback(gl, this.magFilter));

    } else {
        gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, convertConstant(gl, this.minFilter));
        gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, convertConstant(gl, this.magFilter));
    }

    const glFormat = convertConstant(gl, this.format, this.encoding);
    const glType = convertConstant(gl, this.type);
    const glInternalFormat = getInternalFormat(gl, this.internalFormat, glFormat, glType, this.encoding, false);

    gl.texStorage2D(gl.TEXTURE_2D, levels, glInternalFormat, mipmaps[0].width, mipmaps[0].height);

    for (let i = 0, len = mipmaps.length; i < len; i++) {

        const mipmap = mipmaps[i];

        if (this.format !== RGBAFormat) {
            if (glFormat !== null) {
                gl.compressedTexSubImage2D(gl.TEXTURE_2D, i, 0, 0, mipmap.width, mipmap.height, glFormat, mipmap.data);
            } else {
                console.warn('Attempt to load unsupported compressed texture format in .setCompressedData()');
            }
        } else {
            gl.texSubImage2D(gl.TEXTURE_2D, i, 0, 0, mipmap.width, mipmap.height, glFormat, glType, mipmap.data);
        }
    }

    //    if (generateMipMap) {
    // //       gl.generateMipmap(this.target); // Only for roughness textures?
    //    }

    gl.bindTexture(this.target, null);
}
