constructor(cfg) {
  super();

  /** @type {string} */
  this.id = cfg.id;
  /** @type {string} */
  this.type = cfg.type;
  /** @type {any} */
  this.options = undefined;
  /** @type {CanvasRenderingContext2D} */
  this.ctx = cfg.ctx;
  /** @type {Chart} */
  this.chart = cfg.chart;

  // implements box
  /** @type {number} */
  this.top = undefined;
  /** @type {number} */
  this.bottom = undefined;
  /** @type {number} */
  this.left = undefined;
  /** @type {number} */
  this.right = undefined;
  /** @type {number} */
  this.width = undefined;
  /** @type {number} */
  this.height = undefined;
  this._margins = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  };
  /** @type {number} */
  this.maxWidth = undefined;
  /** @type {number} */
  this.maxHeight = undefined;
  /** @type {number} */
  this.paddingTop = undefined;
  /** @type {number} */
  this.paddingBottom = undefined;
  /** @type {number} */
  this.paddingLeft = undefined;
  /** @type {number} */
  this.paddingRight = undefined;

  // scale-specific properties
  /** @type {string=} */
  this.axis = undefined;
  /** @type {number=} */
  this.labelRotation = undefined;
  this.min = undefined;
  this.max = undefined;
  this._range = undefined;
  /** @type {Tick[]} */
  this.ticks = [];
  /** @type {object[]|null} */
  this._gridLineItems = null;
  /** @type {object[]|null} */
  this._labelItems = null;
  /** @type {object|null} */
  this._labelSizes = null;
  this._length = 0;
  this._maxLength = 0;
  this._longestTextCache = {};
  /** @type {number} */
  this._startPixel = undefined;
  /** @type {number} */
  this._endPixel = undefined;
  this._reversePixels = false;
  this._userMax = undefined;
  this._userMin = undefined;
  this._suggestedMax = undefined;
  this._suggestedMin = undefined;
  this._ticksLength = 0;
  this._borderValue = 0;
  this._cache = {};
  this._dataLimitsCached = false;
  this.$context = undefined;
}
