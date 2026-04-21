createMarkerEditor() {
    const geometryToEdit = this._shadow || this._geometry,
        map = this.getMap();
    if (!geometryToEdit._canEdit()) {
        if (console) {
            console.warn('A marker can\'t be resized with symbol:', geometryToEdit.getSymbol());
        }
        return;
    }

    if (!this._history) {
        this._recordHistory(getUpdates());
    }
    //only image marker and vector marker can be edited now.

    const symbol = geometryToEdit._getInternalSymbol();
    const dxdy = new Point(0, 0);
    if (isNumber(symbol['markerDx'])) {
        dxdy.x = symbol['markerDx'];
    }
    if (isNumber(symbol['markerDy'])) {
        dxdy.y = symbol['markerDy'];
    }

    let blackList = null;
    let verticalAnchor = 'middle';
    let horizontalAnchor = 'middle';

    if (Symbolizers.VectorMarkerSymbolizer.test(symbol)) {
        const type = symbol['markerType'];
        if (type === 'pin' || type === 'pie' || type === 'bar') {
            //as these types of markers' anchor stands on its bottom
            blackList = [5, 6, 7];
            verticalAnchor = 'bottom';
        } else if (type === 'rectangle') {
            blackList = [0, 1, 2, 3, 5];
            verticalAnchor = 'top';
            horizontalAnchor = 'left';
        }
    } else if (Symbolizers.ImageMarkerSymbolizer.test(symbol) ||
        Symbolizers.VectorPathMarkerSymbolizer.test(symbol)) {
        verticalAnchor = 'bottom';
        blackList = [5, 6, 7];
    }

    //defines what can be resized by the handle
    //0: resize width; 1: resize height; 2: resize both width and height.
    const resizeAbilities = [
        2, 1, 2,
        0, 0,
        2, 1, 2
    ];

    let aspectRatio;
    if (this.options['fixAspectRatio']) {
        const size = geometryToEdit.getSize();
        aspectRatio = size.width / size.height;
    }

    const resizeHandles = this._createResizeHandles(blackList, (containerPoint, i) => {
        if (blackList && blackList.indexOf(i) >= 0) {
            //need to change marker's coordinates
            const newCoordinates = map.containerPointToCoordinate(containerPoint.sub(dxdy));
            const coordinates = geometryToEdit.getCoordinates();
            newCoordinates.x = coordinates.x;
            geometryToEdit.setCoordinates(newCoordinates);
            this._updateCoordFromShadow(true);
            // geometryToEdit.setCoordinates(newCoordinates);
            //coordinates changed, and use mirror handle instead to caculate width and height
            const mirrorHandle = resizeHandles[resizeHandles.length - 1 - i];
            const mirror = mirrorHandle.getContainerPoint();
            containerPoint = mirror;
        }

        //caculate width and height
        const viewCenter = map.coordToContainerPoint(geometryToEdit.getCoordinates()).add(dxdy),
            symbol = geometryToEdit._getInternalSymbol();
        const wh = containerPoint.sub(viewCenter);
        if (verticalAnchor === 'bottom' && containerPoint.y > viewCenter.y) {
            wh.y = 0;
        }

        //if this marker's anchor is on its bottom, height doesn't need to multiply by 2.
        const vr = verticalAnchor === 'middle' ? 2 : 1;
        const hr = horizontalAnchor === 'left' ? 1 : 2;
        let width = Math.abs(wh.x) * hr,
            height = Math.abs(wh.y) * vr;
        if (aspectRatio) {
            width = Math.max(width, height * aspectRatio);
            height = width / aspectRatio;
        }
        const ability = resizeAbilities[i];
        if (!(geometryToEdit instanceof TextBox)) {
            if (aspectRatio || ability === 0 || ability === 2) {
                symbol['markerWidth'] = Math.min(width, this._geometry.options['maxMarkerWidth'] || Infinity);
            }
            if (aspectRatio || ability === 1 || ability === 2) {
                symbol['markerHeight'] = Math.min(height, this._geometry.options['maxMarkerHeight'] || Infinity);
            }
            geometryToEdit.setSymbol(symbol);
            if (geometryToEdit !== this._geometry) {
                this._geometry.setSymbol(symbol);
            }
        } else {
            if (aspectRatio || ability === 0 || ability === 2) {
                geometryToEdit.setWidth(width);
                if (geometryToEdit !== this._geometry) {
                    this._geometry.setWidth(width);
                }
            }
            if (aspectRatio || ability === 1 || ability === 2) {
                geometryToEdit.setHeight(height);
                if (geometryToEdit !== this._geometry) {
                    this._geometry.setHeight(height);
                }
            }
        }
    }, () => {
        this._update(getUpdates());
    });

    function getUpdates() {
        const updates = [
            ['setCoordinates', geometryToEdit.getCoordinates().toArray()]
        ];
        if (geometryToEdit instanceof TextBox) {
            updates.push(['setWidth', geometryToEdit.getWidth()]);
            updates.push(['setHeight', geometryToEdit.getHeight()]);
        } else {
            updates.push(['setSymbol', geometryToEdit.getSymbol()]);
        }
        return updates;
    }
}
