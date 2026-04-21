class CRS {

    /**
     * @param {String} type          - type of the CRS
     * @param {Object} properties    - CRS's properties
     */
    constructor(type, properties) {
        this.type = type;
        this.properties = properties;
    }

    /**
     * Create a [proj4]{@link https://github.com/OSGeo/proj.4} style CRS used by maptalks <br>
     * @example
     * {
     *     "type"       : "proj4",
     *     "properties" : {
     *         "proj"   : "+proj=longlat +datum=WGS84 +no_defs"
     *     }
     * }
     * var crs_wgs84 = CRS.createProj4("+proj=longlat +datum=WGS84 +no_defs");
     * @param  {String} proj - a proj4 projection string.
     * @return {CRS}
     */
    static createProj4(proj) {
        return new CRS('proj4', {
            'proj': proj
        });
    }

    static fromProjectionCode(code) {
        if (!code) {
            return null;
        }
        code = code.toUpperCase().replace(':', '');
        return CRS[code] || null;
    }
}
