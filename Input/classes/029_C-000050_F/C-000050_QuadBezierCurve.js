class QuadBezierCurve extends Curve {

    static fromJSON(json) {
        const feature = json['feature'];
        const curve = new QuadBezierCurve(feature['geometry']['coordinates'], json['options']);
        curve.setProperties(feature['properties']);
        return curve;
    }

    _toJSON(options) {
        return {
            'feature': this.toGeoJSON(options),
            'subType': 'QuadBezierCurve'
        };
    }

    // paint method on canvas
    _paintOn(ctx, points, lineOpacity) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        this._quadraticCurve(ctx, points, lineOpacity);
        Canvas._stroke(ctx, lineOpacity);
        this._paintArrow(ctx, points, lineOpacity);
    }

    _getArrowPoints(arrows, segments, lineWidth, arrowStyle, tolerance) {
        return this._getCurveArrowPoints(arrows, segments, lineWidth, arrowStyle, tolerance, 2);
    }
}
