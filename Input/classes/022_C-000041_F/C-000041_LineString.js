class LineString extends Path {

    /**
     * @param {Coordinate[]|Number[][]} coordinates - coordinates of the line string
     * @param {Object} [options=null] - construct options defined in [LineString]{@link LineString#options}
     */
    constructor(coordinates, options) {
        super(options);
        this.type = 'LineString';
        if (coordinates) {
            this.setCoordinates(coordinates);
        }
    }

    getOutline() {
        return Polygon.prototype.getOutline.call(this);
    }

    /**
     * Set new coordinates to the line string
     * @param {Coordinate[]|Number[][]} coordinates - new coordinates
     * @fires LineString#shapechange
     * @return {LineString} this
     */
    setCoordinates(coordinates) {
        if (!coordinates) {
            this._coordinates = null;
            this._setPrjCoordinates(null);
            return this;
        }
        this._coordinates = Coordinate.toCoordinates(coordinates);
        if (this.getMap()) {
            this._setPrjCoordinates(this._projectCoords(this._coordinates));
        } else {
            this.onShapeChanged();
        }
        return this;
    }

    /**
     * Get coordinates of the line string
     * @return {Coordinate[]|Number[][]} coordinates
     */
    getCoordinates() {
        return this._coordinates || [];
    }

    /**
     * Get center of linestring's intersection with give extent
     * @example
     *  const extent = map.getExtent();
     *  const center = line.getCenterInExtent(extent);
     * @param {Extent} extent
     * @return {Coordinate} center, null if line doesn't intersect with extent
     */
    getCenterInExtent(extent) {
        return this._getCenterInExtent(extent, this.getCoordinates(), clipLine);
    }

    _computeGeodesicLength(measurer) {
        return measurer.measureLength(this.getCoordinates());
    }

    _computeGeodesicArea() {
        return 0;
    }
}
