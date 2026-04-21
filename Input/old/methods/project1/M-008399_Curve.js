_getLengths(divisions) {
    if (!divisions) {
        divisions = (this.__arcLengthDivisions) ? (this.__arcLengthDivisions) : 200;
    }
    if (this.cacheArcLengths && (this.cacheArcLengths.length === divisions + 1) && !this.needsUpdate) {
        return this.cacheArcLengths;

    }
    this.needsUpdate = false;
    var cache = [];
    var current;
    var last = this.getPoint(0);
    var p;
    var sum = 0;
    cache.push(0);
    for (p = 1; p <= divisions; p++) {
        current = this.getPoint(p / divisions);
        sum += math.lenVec3(math.subVec3(current, last, []));
        cache.push(sum);
        last = current;
    }
    this.cacheArcLengths = cache;
    return cache; // { sums: cache, sum:sum }, Sum is in the last element.
}
