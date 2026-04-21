_refresh() {
    const textStyle = this.getTextStyle() || {},
        padding = textStyle['padding'] || [12, 8];
    let maxWidth, maxHeight;
    if (isFunctionDefinition(this._width)) {
        maxWidth = JSON.parse(JSON.stringify(this._width));
        const stops = maxWidth.stops;
        if (stops) {
            for (let i = 0; i < stops.length; i++) {
                stops[i][1] = stops[i][1] - 2 * padding[0];
            }
        }
    } else {
        maxWidth = this._width - 2 * padding[0];
    }
    if (isFunctionDefinition(this._height)) {
        maxHeight = JSON.parse(JSON.stringify(this._height));
        const stops = maxHeight.stops;
        if (stops) {
            for (let i = 0; i < stops.length; i++) {
                stops[i][1] = stops[i][1] - 2 * padding[1];
            }
        }
    } else {
        maxHeight = this._height - 2 * padding[1];
    }
    const symbol = extend({},
        textStyle.symbol || this._getDefaultTextSymbol(),
        this.options.boxSymbol || this._getDefaultBoxSymbol(),
        {
            'textName' : this._content,
            'markerWidth' : this._width,
            'markerHeight' : this._height,
            'textHorizontalAlignment' : 'middle',
            'textVerticalAlignment' : 'middle',
            'textMaxWidth' : maxWidth,
            'textMaxHeight' : maxHeight
        });

    if (textStyle['wrap'] && !symbol['textWrapWidth']) {
        symbol['textWrapWidth'] = maxWidth;
    }

    // function-type markerWidth and markerHeight doesn't support left/right horizontalAlignment and top/bottom verticalAlignment now
    const hAlign = textStyle['horizontalAlignment'];
    symbol['textDx'] = symbol['markerDx'] || 0;
    let offsetX;
    if (isFunctionDefinition(this._width)) {
        offsetX = JSON.parse(JSON.stringify(this._width));
        const stops = offsetX.stops;
        if (stops) {
            for (let i = 0; i < stops.length; i++) {
                stops[i][1] = stops[i][1] / 2 - padding[0];
                if (hAlign === 'left') {
                    stops[i][1] *= -1;
                }
            }
        }
    } else {
        offsetX = symbol['markerWidth'] / 2 - padding[0];
        if (hAlign === 'left') {
            offsetX *= -1;
        }
    }
    if (hAlign === 'left') {
        symbol['textHorizontalAlignment'] = 'right';
        symbol['textDx'] = offsetX;
    } else if (hAlign === 'right') {
        symbol['textHorizontalAlignment'] = 'left';
        symbol['textDx'] = offsetX;
    }

    const vAlign = textStyle['verticalAlignment'];
    symbol['textDy'] = symbol['markerDy'] || 0;
    let offsetY;
    if (isFunctionDefinition(this._height)) {
        offsetY = JSON.parse(JSON.stringify(this._height));
        const stops = offsetY.stops;
        if (stops) {
            for (let i = 0; i < stops.length; i++) {
                stops[i][1] = stops[i][1] / 2 - padding[1];
                if (vAlign === 'top') {
                    stops[i][1] *= -1;
                }
            }
        }
    } else {
        offsetY = symbol['markerHeight'] / 2 - padding[1];
        if (vAlign === 'top') {
            offsetY *= -1;
        }
    }
    if (vAlign === 'top') {
        symbol['textVerticalAlignment'] = 'bottom';
        symbol['textDy'] = offsetY;
    } else if (vAlign === 'bottom') {
        symbol['textVerticalAlignment'] = 'top';
        symbol['textDy'] = offsetY;
    }
    this._refreshing = true;
    this.updateSymbol(symbol);
    delete this._refreshing;
}
