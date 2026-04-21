export default class LineElement extends Element {

  static id = 'line';

  /**
   * @type {any}
   */
  static defaults = {
    borderCapStyle: 'butt',
    borderDash: [],
    borderDashOffset: 0,
    borderJoinStyle: 'miter',
    borderWidth: 3,
    capBezierPoints: true,
    cubicInterpolationMode: 'default',
    fill: false,
    spanGaps: false,
    stepped: false,
    tension: 0,
  };

  /**
   * @type {any}
   */
  static defaultRoutes = {
    backgroundColor: 'backgroundColor',
    borderColor: 'borderColor'
  };


  static descriptors = {
    _scriptable: true,
    _indexable: (name) => name !== 'borderDash' && name !== 'fill',
  };


  constructor(cfg) {
    super();

    this.animated = true;
    this.options = undefined;
    this._chart = undefined;
    this._loop = undefined;
    this._fullLoop = undefined;
    this._path = undefined;
    this._points = undefined;
    this._segments = undefined;
    this._decimated = false;
    this._pointsUpdated = false;
    this._datasetIndex = undefined;

    if (cfg) {
      Object.assign(this, cfg);
    }
  }

  updateControlPoints(chartArea, indexAxis) {
    const options = this.options;
    if ((options.tension || options.cubicInterpolationMode === 'monotone') && !options.stepped && !this._pointsUpdated) {
      const loop = options.spanGaps ? this._loop : this._fullLoop;
      _updateBezierControlPoints(this._points, options, chartArea, loop, indexAxis);
      this._pointsUpdated = true;
    }
  }

  set points(points) {
    this._points = points;
    delete this._segments;
    delete this._path;
    this._pointsUpdated = false;
  }

  get points() {
    return this._points;
  }

  get segments() {
    return this._segments || (this._segments = _computeSegments(this, this.options.segment));
  }

  /**
	 * First non-skipped point on this line
	 * @returns {PointElement|undefined}
	 */
  first() {
    const segments = this.segments;
    const points = this.points;
    return segments.length && points[segments[0].start];
  }

  /**
	 * Last non-skipped point on this line
	 * @returns {PointElement|undefined}
	 */
  last() {
    const segments = this.segments;
    const points = this.points;
    const count = segments.length;
    return count && points[segments[count - 1].end];
  }

  /**
	 * Interpolate a point in this line at the same value on `property` as
	 * the reference `point` provided
	 * @param {PointElement} point - the reference point
	 * @param {string} property - the property to match on
	 * @returns {PointElement|undefined}
	 */
  interpolate(point, property) {
    const options = this.options;
    const value = point[property];
    const points = this.points;
    const segments = _boundSegments(this, {property, start: value, end: value});

    if (!segments.length) {
      return;
    }

    const result = [];
    const _interpolate = _getInterpolationMethod(options);
    let i, ilen;
    for (i = 0, ilen = segments.length; i < ilen; ++i) {
      const {start, end} = segments[i];
      const p1 = points[start];
      const p2 = points[end];
      if (p1 === p2) {
        result.push(p1);
        continue;
      }
      const t = Math.abs((value - p1[property]) / (p2[property] - p1[property]));
      const interpolated = _interpolate(p1, p2, t, options.stepped);
      interpolated[property] = point[property];
      result.push(interpolated);
    }
    return result.length === 1 ? result[0] : result;
  }

  /**
	 * Append a segment of this line to current path.
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {object} segment
	 * @param {number} segment.start - start index of the segment, referring the points array
 	 * @param {number} segment.end - end index of the segment, referring the points array
 	 * @param {boolean} segment.loop - indicates that the segment is a loop
	 * @param {object} params
	 * @param {boolean} params.move - move to starting point (vs line to it)
	 * @param {boolean} params.reverse - path the segment from end to start
	 * @param {number} params.start - limit segment to points starting from `start` index
	 * @param {number} params.end - limit segment to points ending at `start` + `count` index
	 * @returns {undefined|boolean} - true if the segment is a full loop (path should be closed)
	 */
  pathSegment(ctx, segment, params) {
    const segmentMethod = _getSegmentMethod(this);
    return segmentMethod(ctx, this, segment, params);
  }

  /**
	 * Append all segments of this line to current path.
	 * @param {CanvasRenderingContext2D|Path2D} ctx
	 * @param {number} [start]
	 * @param {number} [count]
	 * @returns {undefined|boolean} - true if line is a full loop (path should be closed)
	 */
  path(ctx, start, count) {
    const segments = this.segments;
    const segmentMethod = _getSegmentMethod(this);
    let loop = this._loop;

    start = start || 0;
    count = count || (this.points.length - start);

    for (const segment of segments) {
      loop &= segmentMethod(ctx, this, segment, {start, end: start + count - 1});
    }
    return !!loop;
  }

  /**
	 * Draw
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {object} chartArea
	 * @param {number} [start]
	 * @param {number} [count]
	 */
  draw(ctx, chartArea, start, count) {
    const options = this.options || {};
    const points = this.points || [];

    if (points.length && options.borderWidth) {
      ctx.save();

      draw(ctx, this, start, count);

      ctx.restore();
    }

    if (this.animated) {
      // When line is animated, the control points and path are not cached.
      this._pointsUpdated = false;
      this._path = undefined;
    }
  }
}
