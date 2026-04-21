getDds() {
    Debug.assert(this.format === PIXELFORMAT_RGBA8, "This format is not implemented yet");

    let fsize = 128;
    let idx = 0;
    while (this._levels[idx]) {
        if (!this.cubemap) {
            const mipSize = this._levels[idx].length;
            if (!mipSize) {
                Debug.error(`No byte array for mip ${idx}`);
                return undefined;
            }
            fsize += mipSize;
        } else {
            for (let face = 0; face < 6; face++) {
                if (!this._levels[idx][face]) {
                    Debug.error(`No level data for mip ${idx}, face ${face}`);
                    return undefined;
                }
                const mipSize = this._levels[idx][face].length;
                if (!mipSize) {
                    Debug.error(`No byte array for mip ${idx}, face ${face}`);
                    return undefined;
                }
                fsize += mipSize;
            }
        }
        fsize += this._levels[idx].length;
        idx++;
    }

    const buff = new ArrayBuffer(fsize);
    const header = new Uint32Array(buff, 0, 128 / 4);

    const DDS_MAGIC = 542327876; // "DDS"
    const DDS_HEADER_SIZE = 124;
    const DDS_FLAGS_REQUIRED = 0x01 | 0x02 | 0x04 | 0x1000 | 0x80000; // caps | height | width | pixelformat | linearsize
    const DDS_FLAGS_MIPMAP = 0x20000;
    const DDS_PIXELFORMAT_SIZE = 32;
    const DDS_PIXELFLAGS_RGBA8 = 0x01 | 0x40; // alpha | rgb
    const DDS_CAPS_REQUIRED = 0x1000;
    const DDS_CAPS_MIPMAP = 0x400000;
    const DDS_CAPS_COMPLEX = 0x8;
    const DDS_CAPS2_CUBEMAP = 0x200 | 0x400 | 0x800 | 0x1000 | 0x2000 | 0x4000 | 0x8000; // cubemap | all faces

    let flags = DDS_FLAGS_REQUIRED;
    if (this._levels.length > 1) flags |= DDS_FLAGS_MIPMAP;

    let caps = DDS_CAPS_REQUIRED;
    if (this._levels.length > 1) caps |= DDS_CAPS_MIPMAP;
    if (this._levels.length > 1 || this.cubemap) caps |= DDS_CAPS_COMPLEX;

    const caps2 = this.cubemap ? DDS_CAPS2_CUBEMAP : 0;

    header[0] = DDS_MAGIC;
    header[1] = DDS_HEADER_SIZE;
    header[2] = flags;
    header[3] = this.height;
    header[4] = this.width;
    header[5] = this.width * this.height * 4;
    header[6] = 0; // depth
    header[7] = this._levels.length;
    for (let i = 0; i < 11; i++) {
        header[8 + i] = 0;
    }
    header[19] = DDS_PIXELFORMAT_SIZE;
    header[20] = DDS_PIXELFLAGS_RGBA8;
    header[21] = 0; // fourcc
    header[22] = 32; // bpp
    header[23] = 0x00FF0000; // R mask
    header[24] = 0x0000FF00; // G mask
    header[25] = 0x000000FF; // B mask
    header[26] = 0xFF000000; // A mask
    header[27] = caps;
    header[28] = caps2;
    header[29] = 0;
    header[30] = 0;
    header[31] = 0;

    let offset = 128;
    if (!this.cubemap) {
        for (let i = 0; i < this._levels.length; i++) {
            const level = this._levels[i];
            const mip = new Uint8Array(buff, offset, level.length);
            for (let j = 0; j < level.length; j++) {
                mip[j] = level[j];
            }
            offset += level.length;
        }
    } else {
        for (let face = 0; face < 6; face++) {
            for (let i = 0; i < this._levels.length; i++) {
                const level = this._levels[i][face];
                const mip = new Uint8Array(buff, offset, level.length);
                for (let j = 0; j < level.length; j++) {
                    mip[j] = level[j];
                }
                offset += level.length;
            }
        }
    }

    return buff;
}
