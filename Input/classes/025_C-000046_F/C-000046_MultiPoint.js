class MultiPoint extends MultiGeometry {

    /**
     * @param {Number[][]|Coordinate[]|Marker[]} data - construct data, coordinates or an array of markers
     * @param {Object} [options=null] - options defined in [nMultiPoint]{@link MultiPoint#options}
     */
    constructor(data, opts) {
        super(Marker, 'MultiPoint', data, opts);
    }

    /**
     * Find the closet point to the give coordinate
     * @param {Coordinate} coordinate coordinate
     * @returns {Coordinate} coordinate
     */
    findClosest(coordinate) {
        if (!coordinate) {
            return null;
        }
        const coords = this.getCoordinates();
        let hit = null;
        let max = Infinity;
        coords.forEach(c => {
            const dist = distanceTo(c, coordinate);
            if (dist < max) {
                hit = c;
                max = dist;
            }
        });
        return hit;
    }
}
