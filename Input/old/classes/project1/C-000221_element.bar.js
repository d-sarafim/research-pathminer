export default class BarElement extends Element {

  static id = 'bar';

  /**
   * @type {any}
   */
  static defaults = {
    borderSkipped: 'start',
    borderWidth: 0,
    borderRadius: 0,
    inflateAmount: 'auto',
    pointStyle: undefined
  };

  /**
   * @type {any}
   */
  static defaultRoutes = {
    backgroundColor: 'backgroundColor',
    borderColor: 'borderColor'
  };

  constructor(cfg) {
    super();

    this.options = undefined;
    this.horizontal = undefined;
    this.base = undefined;
    this.width = undefined;
    this.height = undefined;
    this.inflateAmount = undefined;

    if (cfg) {
      Object.assign(this, cfg);
    }
  }

  draw(ctx) {
    const {inflateAmount, options: {borderColor, backgroundColor}} = this;
    const {inner, outer} = boundingRects(this);
    const addRectPath = hasRadius(outer.radius) ? addRoundedRectPath : addNormalRectPath;

    ctx.save();

    if (outer.w !== inner.w || outer.h !== inner.h) {
      ctx.beginPath();
      addRectPath(ctx, inflateRect(outer, inflateAmount, inner));
      ctx.clip();
      addRectPath(ctx, inflateRect(inner, -inflateAmount, outer));
      ctx.fillStyle = borderColor;
      ctx.fill('evenodd');
    }

    ctx.beginPath();
    addRectPath(ctx, inflateRect(inner, inflateAmount));
    ctx.fillStyle = backgroundColor;
    ctx.fill();

    ctx.restore();
  }

  inRange(mouseX, mouseY, useFinalPosition) {
    return inRange(this, mouseX, mouseY, useFinalPosition);
  }

  inXRange(mouseX, useFinalPosition) {
    return inRange(this, mouseX, null, useFinalPosition);
  }

  inYRange(mouseY, useFinalPosition) {
    return inRange(this, null, mouseY, useFinalPosition);
  }

  getCenterPoint(useFinalPosition) {
    const {x, y, base, horizontal} = /** @type {BarProps} */ (this.getProps(['x', 'y', 'base', 'horizontal'], useFinalPosition));
    return {
      x: horizontal ? (x + base) / 2 : x,
      y: horizontal ? y : (y + base) / 2
    };
  }

  getRange(axis) {
    return axis === 'x' ? this.width / 2 : this.height / 2;
  }
}
