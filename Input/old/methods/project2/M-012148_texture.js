setSource(source, mipLevel = 0) {
    let invalid = false;
    let width, height;

    if (this._cubemap) {
        if (source[0]) {
            // rely on first face sizes
            width = source[0].width || 0;
            height = source[0].height || 0;

            for (let i = 0; i < 6; i++) {
                const face = source[i];
                // cubemap becomes invalid if any condition is not satisfied
                if (!face ||                  // face is missing
                    face.width !== width ||   // face is different width
                    face.height !== height || // face is different height
                    !this.device._isBrowserInterface(face)) {            // new image bitmap
                    invalid = true;
                    break;
                }
            }
        } else {
            // first face is missing
            invalid = true;
        }

        if (!invalid) {
            // mark levels as updated
            for (let i = 0; i < 6; i++) {
                if (this._levels[mipLevel][i] !== source[i])
                    this._levelsUpdated[mipLevel][i] = true;
            }
        }
    } else {
        // check if source is valid type of element
        if (!this.device._isBrowserInterface(source))
            invalid = true;

        if (!invalid) {
            // mark level as updated
            if (source !== this._levels[mipLevel])
                this._levelsUpdated[mipLevel] = true;

            width = source.width;
            height = source.height;
        }
    }

    if (invalid) {
        // invalid texture

        // default sizes
        this._width = 4;
        this._height = 4;

        // remove levels
        if (this._cubemap) {
            for (let i = 0; i < 6; i++) {
                this._levels[mipLevel][i] = null;
                this._levelsUpdated[mipLevel][i] = true;
            }
        } else {
            this._levels[mipLevel] = null;
            this._levelsUpdated[mipLevel] = true;
        }
    } else {
        // valid texture
        if (mipLevel === 0) {
            this._width = width;
            this._height = height;
        }

        this._levels[mipLevel] = source;
    }

    // valid or changed state of validity
    if (this._invalid !== invalid || !invalid) {
        this._invalid = invalid;

        // reupload
        this.upload();
    }
}
