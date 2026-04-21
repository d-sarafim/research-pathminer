class CollisionIndex {
    constructor() {
        this._tree = rbush(9, ['[0]', '[1]', '[2]', '[3]']);
    }

    /**
     * Test if given box is collided with any other
     * @param {Number[]} box - [minx, miny, maxx, maxy]
     * @returns {Boolean}
     */
    collides(box) {
        [search.minX, search.minY, search.maxX, search.maxY] = box;
        return this._tree.collides(search);
    }

    /**
     * Insert box in collision index
     * @param {Number[]} box - [minx, miny, maxx, maxy]
     * @returns {CollisionIndex} this
     */
    insertBox(box) {
        const tree = this._tree;
        tree.insert(box);
        return this;
    }

    /**
     * Bulk insert boxes in collision index
     * Powered by rbush, it will perform better in subsquent query
     * @param {Number[][]} boxes - [[minx, miny, maxx, maxy], ...]
     * @returns {CollisionIndex} this
     */
    bulkInsertBox(boxes) {
        this._tree.load(boxes);
        return this;
    }

    /**
     * Clear the collision index
     * @returns {CollisionIndex} this
     */
    clear() {
        this._tree.clear();
        return this;
    }
}
