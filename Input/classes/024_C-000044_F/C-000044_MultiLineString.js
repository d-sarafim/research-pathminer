class MultiLineString extends MultiPath {

    /**
     * @param {Number[][][]|Coordinate[][]|LineString[]} data - construct data, coordinates or an array of linestrings
     * @param {Object} [options=null]           - options defined in [MultiLineString]{@link MultiLineString#options}
     */
    constructor(data, options) {
        super(LineString, 'MultiLineString', data, options);
    }
}
