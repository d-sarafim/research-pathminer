class Sphere {
    /**
     * @param  {Number} radius Sphere's radius
     */
    constructor(radius) {
        this.radius = radius;
    }

    measureLenBetween(c1, c2) {
        if (!c1 || !c2) {
            return 0;
        }
        let b = toRadian(c1.y);
        const d = toRadian(c2.y),
            e = b - d,
            f = toRadian(c1.x) - toRadian(c2.x);
        b = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(e / 2), 2) + Math.cos(b) * Math.cos(d) * Math.pow(Math.sin(f / 2), 2)));
        b *= this.radius;
        return b;
    }

    measureArea(coordinates) {
        const a = toRadian(this.radius);
        let b = 0,
            c = coordinates,
            d = c.length;
        if (d < 3) {
            return 0;
        }
        let i;
        for (i = 0; i < d - 1; i++) {
            const e = c[i],
                f = c[i + 1];
            b += e.x * a * Math.cos(toRadian(e.y)) * f.y * a - f.x * a * Math.cos(toRadian(f.y)) * e.y * a;
        }
        d = c[i];
        c = c[0];
        b += d.x * a * Math.cos(toRadian(d.y)) * c.y * a - c.x * a * Math.cos(toRadian(c.y)) * d.y * a;
        return 0.5 * Math.abs(b);
    }

    locate(c, xDist, yDist, out) {
        out = out || new Coordinate(0, 0);
        out.set(c.x, c.y);
        return this._locate(out, xDist, yDist);
    }

    _locate(c, xDist, yDist) {
        if (!c) {
            return null;
        }
        if (!xDist) {
            xDist = 0;
        }
        if (!yDist) {
            yDist = 0;
        }
        if (!xDist && !yDist) {
            return c;
        }
        let x, y;
        let ry = toRadian(c.y);
        if (yDist !== 0) {
            const dy = Math.abs(yDist);
            const sy = Math.sin(dy / (2 * this.radius)) * 2;
            ry = ry + sy * (yDist > 0 ? 1 : -1);
            y = wrap(ry * 180 / Math.PI, -90, 90);
        } else {
            y = c.y;
        }
        if (xDist !== 0) {
            // distance per degree
            const dx = Math.abs(xDist);
            let rx = toRadian(c.x);
            const sx = 2 * Math.sqrt(Math.pow(Math.sin(dx / (2 * this.radius)), 2) / Math.pow(Math.cos(ry), 2));
            rx = rx + sx * (xDist > 0 ? 1 : -1);
            x = wrap(rx * 180 / Math.PI, -180, 180);
        } else {
            x = c.x;
        }
        c.x = x;
        c.y = y;
        return c;
    }

    rotate(c, pivot, angle) {
        c = new Coordinate(c);
        return this._rotate(c, pivot, angle);
    }

    /**
     * Rotate a coordinate of given angle around pivot
     * @param {Coordinate} c  - source coordinate
     * @param {Coordinate} pivot - pivot
     * @param {Number} angle - angle in degree
     * @return {Coordinate}
     */
    _rotate(c, pivot, angle) {
        const initialAngle = rhumbBearing(pivot, c);
        const finalAngle = initialAngle - angle;
        const distance = this.measureLenBetween(pivot, c);
        c.x = pivot.x;
        c.y = pivot.y;
        return calculateRhumbDestination(c, distance, finalAngle, this.radius);
    }
}
