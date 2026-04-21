class MultiPolygon extends MultiPath {

    /**
     * @param {Number[][][][]|Coordinate[][][]|Polygon[]} data - construct data, coordinates or an array of polygons
     * @param {Object} [options=null]           - options defined in [MultiPolygon]{@link MultiPolygon#options}
     */
    constructor(data, opts) {
        super(Polygon, 'MultiPolygon', data, opts);
    }
}
