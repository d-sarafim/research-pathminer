class TileSystem {

    /**
     * Similar with [transformation]{@link Transformation}, it contains 4 numbers: sx, sy, ox, oy.<br>
     * @see {@link http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification}
     * @param  {Number} sx the order of X-axis tile index, 1 means right is larger and -1 means the reverse, left is larger;
     * @param  {Number} sy the order of Y-axis tile index, 1 means bottom is larger and -1 means the reverse, top is larger;
     * @param  {Number} ox x of the origin point of the world's projected coordinate system
     * @param  {Number} oy y of the origin point of the world's projected coordinate system
     */
    constructor(sx, sy, ox, oy) {
        if (Array.isArray(sx)) {
            this.scale = {
                x: sx[0],
                y: sx[1]
            };
            this.origin = {
                x: sx[2],
                y: sx[3]
            };
        } else {
            this.scale = {
                x: sx,
                y: sy
            };
            this.origin = {
                x: ox,
                y: oy
            };
        }
    }

    /**
     * Get the default tile system's code for the projection.
     * @param  {Object} projection      - a projection object
     * @return {String} tile system code
     */
    static getDefault(projection) {
        const code = projection['code'].toLowerCase();
        if (code === 'baidu') {
            return 'baidu';
        } else if (code === 'EPSG:4326'.toLowerCase() || code === 'EPSG:4490'.toLowerCase()) {
            return 'tms-global-geodetic';
        } else if (code === 'identity') {
            return [1, -1, 0, 0];
        } else {
            return 'web-mercator';
        }
    }
}
