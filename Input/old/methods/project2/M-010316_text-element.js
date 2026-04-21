_updateMeshes() {
    const json = this._font.data;
    const self = this;

    const minFont = Math.min(this._minFontSize, this._maxFontSize);
    const maxFont = this._maxFontSize;

    const autoFit = this._shouldAutoFit();

    if (autoFit) {
        this._fontSize = this._maxFontSize;
    }

    const MAGIC = 32;
    const l = this._symbols.length;

    let _x = 0; // cursors
    let _y = 0;
    let _z = 0;
    let _xMinusTrailingWhitespace = 0;
    let lines = 1;
    let wordStartX = 0;
    let wordStartIndex = 0;
    let lineStartIndex = 0;
    let numWordsThisLine = 0;
    let numCharsThisLine = 0;
    let numBreaksThisLine = 0;

    const splitHorizontalAnchors = Math.abs(this._element.anchor.x - this._element.anchor.z) >= 0.0001;

    let maxLineWidth = this._element.calculatedWidth;
    if ((this.autoWidth && !splitHorizontalAnchors) || !this._wrapLines) {
        maxLineWidth = Number.POSITIVE_INFINITY;
    }

    let fontMinY = 0;
    let fontMaxY = 0;

    let char, data, quad, nextchar;

    function breakLine(symbols, lineBreakIndex, lineBreakX) {
        self._lineWidths.push(Math.abs(lineBreakX));
        // in rtl mode lineStartIndex will usually be larger than lineBreakIndex and we will
        // need to adjust the start / end indices when calling symbols.slice()
        const sliceStart = lineStartIndex > lineBreakIndex ? lineBreakIndex + 1 : lineStartIndex;
        const sliceEnd = lineStartIndex > lineBreakIndex ? lineStartIndex + 1 : lineBreakIndex;
        const chars = symbols.slice(sliceStart, sliceEnd);

        // Remove line breaks from line.
        // Line breaks would only be there for the final line
        // when we reach the maxLines limit.
        // TODO: We could possibly not do this and just let lines have
        // new lines in them. Apart from being a bit weird it should not affect
        // the rendered text.
        if (numBreaksThisLine) {
            let i = chars.length;
            while (i-- && numBreaksThisLine > 0) {
                if (LINE_BREAK_CHAR.test(chars[i])) {
                    chars.splice(i, 1);
                    numBreaksThisLine--;
                }
            }
        }

        self._lineContents.push(chars.join(''));

        _x = 0;
        _y -= self._scaledLineHeight;
        lines++;
        numWordsThisLine = 0;
        numCharsThisLine = 0;
        numBreaksThisLine = 0;
        wordStartX = 0;
        lineStartIndex = lineBreakIndex;
    }

    let retryUpdateMeshes = true;
    while (retryUpdateMeshes) {
        retryUpdateMeshes = false;

        // if auto-fitting then scale the line height
        // according to the current fontSize value relative to the max font size
        if (autoFit) {
            this._scaledLineHeight = this._lineHeight * this._fontSize / (this._maxFontSize || 0.0001);
        } else {
            this._scaledLineHeight = this._lineHeight;
        }

        this.width = 0;
        this.height = 0;
        this._lineWidths = [];
        this._lineContents = [];

        _x = 0;
        _y = 0;
        _z = 0;
        _xMinusTrailingWhitespace = 0;

        lines = 1;
        wordStartX = 0;
        wordStartIndex = 0;
        lineStartIndex = 0;
        numWordsThisLine = 0;
        numCharsThisLine = 0;
        numBreaksThisLine = 0;

        const scale = this._fontSize / MAGIC;

        // scale max font extents
        fontMinY = this._fontMinY * scale;
        fontMaxY = this._fontMaxY * scale;

        for (let i = 0; i < this._meshInfo.length; i++) {
            this._meshInfo[i].quad = 0;
            this._meshInfo[i].lines = {};
        }

        // per-vertex color
        let color_r = 255;
        let color_g = 255;
        let color_b = 255;

        // per-vertex outline parameters
        let outline_color_rg = 255 + 255 * 256;
        let outline_color_ba = 255 + 255 * 256;
        let outline_thickness = 0;

        // per-vertex shadow parameters
        let shadow_color_rg = 255 + 255 * 256;
        let shadow_color_ba = 255 + 255 * 256;
        let shadow_offset_xy = 127 + 127 * 256;

        // In left-to-right mode we loop through the symbols from start to end.
        // In right-to-left mode we loop through the symbols from end to the beginning
        // in order to wrap lines in the correct order
        for (let i = 0; i < l; i++) {
            char = this._symbols[i];
            nextchar = ((i + 1) >= l) ? null : this._symbols[i + 1];

            // handle line break
            const isLineBreak = LINE_BREAK_CHAR.test(char);
            if (isLineBreak) {
                numBreaksThisLine++;
                // If we are not line wrapping then we should be ignoring maxlines
                if (!this._wrapLines || this._maxLines < 0 || lines < this._maxLines) {
                    breakLine(this._symbols, i, _xMinusTrailingWhitespace);
                    wordStartIndex = i + 1;
                    lineStartIndex = i + 1;
                }
                continue;
            }

            let x = 0;
            let y = 0;
            let advance = 0;
            let quadsize = 1;
            let dataScale, size;

            data = json.chars[char];

            // handle missing glyph
            if (!data) {
                if (CONTROL_CHARS.indexOf(char) !== -1) {
                    // handle unicode control characters
                    data = CONTROL_GLYPH_DATA;
                } else {
                    // otherwise use space character
                    if (json.chars[' ']) {
                        data = json.chars[' '];
                    } else {
                        // eslint-disable-next-line no-unreachable-loop
                        for (const key in json.chars) {
                            data = json.chars[key];
                            break;
                        }
                    }

                    // #if _DEBUG
                    if (!json.missingChars) {
                        json.missingChars = new Set();
                    }

                    if (!json.missingChars.has(char)) {
                        console.warn(`Character '${char}' is missing from the font ${json.info.face}`);
                        json.missingChars.add(char);
                    }
                    // #endif
                }
            }

            if (data) {
                let kerning = 0;
                if (numCharsThisLine > 0) {
                    const kernTable = this._font.data.kerning;
                    if (kernTable) {
                        const kernLeft = kernTable[string.getCodePoint(this._symbols[i - 1]) || 0];
                        if (kernLeft) {
                            kerning = kernLeft[string.getCodePoint(this._symbols[i]) || 0] || 0;
                        }
                    }
                }
                dataScale = data.scale || 1;
                size = (data.width + data.height) / 2;
                quadsize = scale * size / dataScale;
                advance = (data.xadvance + kerning) * scale;
                x = (data.xoffset - kerning) * scale;
                y = data.yoffset * scale;
            } else {
                console.error(`Couldn't substitute missing character: '${char}'`);
            }

            const isWhitespace = WHITESPACE_CHAR.test(char);


            const meshInfoId = (data && data.map) || 0;
            const ratio = -this._font.data.info.maps[meshInfoId].width /
                this._font.data.info.maps[meshInfoId].height;
            const meshInfo = this._meshInfo[meshInfoId];

            const candidateLineWidth = _x + this._spacing * advance;

            // If we've exceeded the maximum line width, move everything from the beginning of
            // the current word onwards down onto a new line.
            if (candidateLineWidth > maxLineWidth && numCharsThisLine > 0 && !isWhitespace) {
                if (this._maxLines < 0 || lines < this._maxLines) {
                    // Handle the case where a line containing only a single long word needs to be
                    // broken onto multiple lines.
                    if (numWordsThisLine === 0) {
                        wordStartIndex = i;
                        breakLine(this._symbols, i, _xMinusTrailingWhitespace);
                    } else {
                        // Move back to the beginning of the current word.
                        const backtrack = Math.max(i - wordStartIndex, 0);
                        if (this._meshInfo.length <= 1) {
                            meshInfo.lines[lines - 1] -= backtrack;
                            meshInfo.quad -= backtrack;
                        } else {
                            // We should only backtrack the quads that were in the word from this same texture
                            // We will have to update N number of mesh infos as a result (all textures used in the word in question)
                            const backtrackStart = wordStartIndex;
                            const backtrackEnd = i;
                            for (let j = backtrackStart; j < backtrackEnd; j++) {
                                const backChar = this._symbols[j];
                                const backCharData = json.chars[backChar];
                                const backMeshInfo = this._meshInfo[(backCharData && backCharData.map) || 0];
                                backMeshInfo.lines[lines - 1] -= 1;
                                backMeshInfo.quad -= 1;
                            }
                        }

                        i -= backtrack + 1;

                        breakLine(this._symbols, wordStartIndex, wordStartX);
                        continue;
                    }
                }
            }

            quad = meshInfo.quad;
            meshInfo.lines[lines - 1] = quad;

            let left = _x - x;
            let right = left + quadsize;
            const bottom = _y - y;
            const top = bottom + quadsize;

            if (this._rtl) {
                // rtl text will be flipped vertically before rendering and here we
                // account for the mis-alignment that would be introduced. shift is calculated
                // as the difference between the glyph's left and right offset.
                const shift = quadsize - x - this._spacing * advance - x;
                left -= shift;
                right -= shift;
            }

            meshInfo.positions[quad * 4 * 3 + 0] = left;
            meshInfo.positions[quad * 4 * 3 + 1] = bottom;
            meshInfo.positions[quad * 4 * 3 + 2] = _z;

            meshInfo.positions[quad * 4 * 3 + 3] = right;
            meshInfo.positions[quad * 4 * 3 + 4] = bottom;
            meshInfo.positions[quad * 4 * 3 + 5] = _z;

            meshInfo.positions[quad * 4 * 3 + 6] = right;
            meshInfo.positions[quad * 4 * 3 + 7] = top;
            meshInfo.positions[quad * 4 * 3 + 8] = _z;

            meshInfo.positions[quad * 4 * 3 + 9]  = left;
            meshInfo.positions[quad * 4 * 3 + 10] = top;
            meshInfo.positions[quad * 4 * 3 + 11] = _z;

            this.width = Math.max(this.width, candidateLineWidth);

            // scale font size if autoFitWidth is true and the width is larger than the calculated width
            let fontSize;
            if (this._shouldAutoFitWidth() && this.width > this._element.calculatedWidth) {
                fontSize = Math.floor(this._element.fontSize * this._element.calculatedWidth / (this.width || 0.0001));
                fontSize = math.clamp(fontSize, minFont, maxFont);
                if (fontSize !== this._element.fontSize) {
                    this._fontSize = fontSize;
                    retryUpdateMeshes = true;
                    break;
                }
            }

            this.height = Math.max(this.height, fontMaxY - (_y + fontMinY));

            // scale font size if autoFitHeight is true and the height is larger than the calculated height
            if (this._shouldAutoFitHeight() && this.height > this._element.calculatedHeight) {
                // try 1 pixel smaller for fontSize and iterate
                fontSize = math.clamp(this._fontSize - 1, minFont, maxFont);
                if (fontSize !== this._element.fontSize) {
                    this._fontSize = fontSize;
                    retryUpdateMeshes = true;
                    break;
                }
            }

            // advance cursor (for RTL we move left)
            _x += this._spacing * advance;

            // For proper alignment handling when a line wraps _on_ a whitespace character,
            // we need to keep track of the width of the line without any trailing whitespace
            // characters. This applies to both single whitespaces and also multiple sequential
            // whitespaces.
            if (!isWhitespace) {
                _xMinusTrailingWhitespace = _x;
            }

            if (this._isWordBoundary(char) || (this._isValidNextChar(nextchar) && (this._isNextCJKBoundary(char, nextchar) || this._isNextCJKWholeWord(nextchar)))) {
                numWordsThisLine++;
                wordStartX = _xMinusTrailingWhitespace;
                wordStartIndex = i + 1;
            }

            numCharsThisLine++;

            const uv = this._getUv(char);

            meshInfo.uvs[quad * 4 * 2 + 0] = uv[0];
            meshInfo.uvs[quad * 4 * 2 + 1] = 1.0 - uv[1];

            meshInfo.uvs[quad * 4 * 2 + 2] = uv[2];
            meshInfo.uvs[quad * 4 * 2 + 3] = 1.0 - uv[1];

            meshInfo.uvs[quad * 4 * 2 + 4] = uv[2];
            meshInfo.uvs[quad * 4 * 2 + 5] = 1.0 - uv[3];

            meshInfo.uvs[quad * 4 * 2 + 6] = uv[0];
            meshInfo.uvs[quad * 4 * 2 + 7] = 1.0 - uv[3];

            // set per-vertex color
            if (this._symbolColors) {
                const colorIdx = this._symbolColors[i] * 3;
                color_r = this._colorPalette[colorIdx];
                color_g = this._colorPalette[colorIdx + 1];
                color_b = this._colorPalette[colorIdx + 2];
            }

            meshInfo.colors[quad * 4 * 4 + 0] = color_r;
            meshInfo.colors[quad * 4 * 4 + 1] = color_g;
            meshInfo.colors[quad * 4 * 4 + 2] = color_b;
            meshInfo.colors[quad * 4 * 4 + 3] = 255;

            meshInfo.colors[quad * 4 * 4 + 4] = color_r;
            meshInfo.colors[quad * 4 * 4 + 5] = color_g;
            meshInfo.colors[quad * 4 * 4 + 6] = color_b;
            meshInfo.colors[quad * 4 * 4 + 7] = 255;

            meshInfo.colors[quad * 4 * 4 + 8] = color_r;
            meshInfo.colors[quad * 4 * 4 + 9] = color_g;
            meshInfo.colors[quad * 4 * 4 + 10] = color_b;
            meshInfo.colors[quad * 4 * 4 + 11] = 255;

            meshInfo.colors[quad * 4 * 4 + 12] = color_r;
            meshInfo.colors[quad * 4 * 4 + 13] = color_g;
            meshInfo.colors[quad * 4 * 4 + 14] = color_b;
            meshInfo.colors[quad * 4 * 4 + 15] = 255;

            // set per-vertex outline parameters
            if (this._symbolOutlineParams) {
                const outlineIdx = this._symbolOutlineParams[i] * 5;
                outline_color_rg = this._outlinePalette[outlineIdx] +
                    this._outlinePalette[outlineIdx + 1] * 256;
                outline_color_ba = this._outlinePalette[outlineIdx + 2] +
                    this._outlinePalette[outlineIdx + 3] * 256;
                outline_thickness = this._outlinePalette[outlineIdx + 4];
            }

            meshInfo.outlines[quad * 4 * 3 + 0] = outline_color_rg;
            meshInfo.outlines[quad * 4 * 3 + 1] = outline_color_ba;
            meshInfo.outlines[quad * 4 * 3 + 2] = outline_thickness;

            meshInfo.outlines[quad * 4 * 3 + 3] = outline_color_rg;
            meshInfo.outlines[quad * 4 * 3 + 4] = outline_color_ba;
            meshInfo.outlines[quad * 4 * 3 + 5] = outline_thickness;

            meshInfo.outlines[quad * 4 * 3 + 6] = outline_color_rg;
            meshInfo.outlines[quad * 4 * 3 + 7] = outline_color_ba;
            meshInfo.outlines[quad * 4 * 3 + 8] = outline_thickness;

            meshInfo.outlines[quad * 4 * 3 + 9] = outline_color_rg;
            meshInfo.outlines[quad * 4 * 3 + 10] = outline_color_ba;
            meshInfo.outlines[quad * 4 * 3 + 11] = outline_thickness;

            // set per-vertex shadow parameters
            if (this._symbolShadowParams) {
                const shadowIdx = this._symbolShadowParams[i] * 6;
                shadow_color_rg = this._shadowPalette[shadowIdx] +
                    this._shadowPalette[shadowIdx + 1] * 256;
                shadow_color_ba = this._shadowPalette[shadowIdx + 2] +
                    this._shadowPalette[shadowIdx + 3] * 256;
                shadow_offset_xy = (this._shadowPalette[shadowIdx + 4] + 127) +
                    Math.round(ratio * this._shadowPalette[shadowIdx + 5] + 127) * 256;
            }

            meshInfo.shadows[quad * 4 * 3 + 0] = shadow_color_rg;
            meshInfo.shadows[quad * 4 * 3 + 1] = shadow_color_ba;
            meshInfo.shadows[quad * 4 * 3 + 2] = shadow_offset_xy;

            meshInfo.shadows[quad * 4 * 3 + 3] = shadow_color_rg;
            meshInfo.shadows[quad * 4 * 3 + 4] = shadow_color_ba;
            meshInfo.shadows[quad * 4 * 3 + 5] = shadow_offset_xy;

            meshInfo.shadows[quad * 4 * 3 + 6] = shadow_color_rg;
            meshInfo.shadows[quad * 4 * 3 + 7] = shadow_color_ba;
            meshInfo.shadows[quad * 4 * 3 + 8] = shadow_offset_xy;

            meshInfo.shadows[quad * 4 * 3 + 9] = shadow_color_rg;
            meshInfo.shadows[quad * 4 * 3 + 10] = shadow_color_ba;
            meshInfo.shadows[quad * 4 * 3 + 11] = shadow_offset_xy;

            meshInfo.quad++;
        }

        if (retryUpdateMeshes) {
            continue;
        }

        // As we only break lines when the text becomes too wide for the container,
        // there will almost always be some leftover text on the final line which has
        // not yet been pushed to _lineContents.
        if (lineStartIndex < l) {
            breakLine(this._symbols, l, _x);
        }
    }

    // force autoWidth / autoHeight change to update width/height of element
    this._noResize = true;
    this.autoWidth = this._autoWidth;
    this.autoHeight = this._autoHeight;
    this._noResize = false;

    // offset for pivot and alignment
    const hp = this._element.pivot.x;
    const vp = this._element.pivot.y;
    const ha = this._alignment.x;
    const va = this._alignment.y;

    for (let i = 0; i < this._meshInfo.length; i++) {
        if (this._meshInfo[i].count === 0) continue;

        let prevQuad = 0;
        for (const line in this._meshInfo[i].lines) {
            const index = this._meshInfo[i].lines[line];
            const lw = this._lineWidths[parseInt(line, 10)];
            const hoffset = -hp * this._element.calculatedWidth + ha * (this._element.calculatedWidth - lw) * (this._rtl ? -1 : 1);
            const voffset = (1 - vp) * this._element.calculatedHeight - fontMaxY - (1 - va) * (this._element.calculatedHeight - this.height);

            for (let quad = prevQuad; quad <= index; quad++) {
                this._meshInfo[i].positions[quad * 4 * 3] += hoffset;
                this._meshInfo[i].positions[quad * 4 * 3 + 3] += hoffset;
                this._meshInfo[i].positions[quad * 4 * 3 + 6] += hoffset;
                this._meshInfo[i].positions[quad * 4 * 3 + 9] += hoffset;

                this._meshInfo[i].positions[quad * 4 * 3 + 1] += voffset;
                this._meshInfo[i].positions[quad * 4 * 3 + 4] += voffset;
                this._meshInfo[i].positions[quad * 4 * 3 + 7] += voffset;
                this._meshInfo[i].positions[quad * 4 * 3 + 10] += voffset;
            }

            // flip rtl characters
            if (this._rtl) {
                for (let quad = prevQuad; quad <= index; quad++) {
                    const idx = quad * 4 * 3;

                    // flip the entire line horizontally
                    for (let vert = 0; vert < 4; ++vert) {
                        this._meshInfo[i].positions[idx + vert * 3] =
                            this._element.calculatedWidth - this._meshInfo[i].positions[idx + vert * 3] + hoffset * 2;
                    }

                    // flip the character horizontally
                    const tmp0 = this._meshInfo[i].positions[idx + 3];
                    const tmp1 = this._meshInfo[i].positions[idx + 6];
                    this._meshInfo[i].positions[idx + 3] = this._meshInfo[i].positions[idx + 0];
                    this._meshInfo[i].positions[idx + 6] = this._meshInfo[i].positions[idx + 9];
                    this._meshInfo[i].positions[idx + 0] = tmp0;
                    this._meshInfo[i].positions[idx + 9] = tmp1;
                }
            }

            prevQuad = index + 1;
        }

        // update vertex buffer
        const numVertices = this._meshInfo[i].count * 4; // number of verts we allocated
        const vertMax = this._meshInfo[i].quad * 4;  // number of verts we need (usually count minus line break characters)
        const it = new VertexIterator(this._meshInfo[i].meshInstance.mesh.vertexBuffer);
        for (let v = 0; v < numVertices; v++) {
            if (v >= vertMax) {
                // clear unused vertices
                it.element[SEMANTIC_POSITION].set(0, 0, 0);
                it.element[SEMANTIC_TEXCOORD0].set(0, 0);
                it.element[SEMANTIC_COLOR].set(0, 0, 0, 0);
                // outline
                it.element[SEMANTIC_ATTR8].set(0, 0, 0, 0);
                // shadow
                it.element[SEMANTIC_ATTR9].set(0, 0, 0, 0);
            } else {
                it.element[SEMANTIC_POSITION].set(this._meshInfo[i].positions[v * 3 + 0], this._meshInfo[i].positions[v * 3 + 1], this._meshInfo[i].positions[v * 3 + 2]);
                it.element[SEMANTIC_TEXCOORD0].set(this._meshInfo[i].uvs[v * 2 + 0], this._meshInfo[i].uvs[v * 2 + 1]);
                it.element[SEMANTIC_COLOR].set(this._meshInfo[i].colors[v * 4 + 0],
                                               this._meshInfo[i].colors[v * 4 + 1],
                                               this._meshInfo[i].colors[v * 4 + 2],
                                               this._meshInfo[i].colors[v * 4 + 3]);
                it.element[SEMANTIC_ATTR8].set(this._meshInfo[i].outlines[v * 3 + 0],
                                               this._meshInfo[i].outlines[v * 3 + 1],
                                               this._meshInfo[i].outlines[v * 3 + 2]);
                it.element[SEMANTIC_ATTR9].set(this._meshInfo[i].shadows[v * 3 + 0],
                                               this._meshInfo[i].shadows[v * 3 + 1],
                                               this._meshInfo[i].shadows[v * 3 + 2]);
            }
            it.next();
        }
        it.end();

        this._meshInfo[i].meshInstance.mesh.aabb.compute(this._meshInfo[i].positions);

        // force update meshInstance aabb
        this._meshInfo[i].meshInstance._aabbVer = -1;
    }

    // flag text element aabb to be updated
    this._aabbDirty = true;
}
