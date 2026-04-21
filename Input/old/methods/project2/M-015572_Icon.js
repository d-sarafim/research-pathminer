constructor(options) {
  options = options || {};

  /**
   * @type {number}
   */
  const opacity = options.opacity !== undefined ? options.opacity : 1;

  /**
   * @type {number}
   */
  const rotation = options.rotation !== undefined ? options.rotation : 0;

  /**
   * @type {number|import("../size.js").Size}
   */
  const scale = options.scale !== undefined ? options.scale : 1;

  /**
   * @type {boolean}
   */
  const rotateWithView =
    options.rotateWithView !== undefined ? options.rotateWithView : false;

  super({
    opacity: opacity,
    rotation: rotation,
    scale: scale,
    displacement:
      options.displacement !== undefined ? options.displacement : [0, 0],
    rotateWithView: rotateWithView,
    declutterMode: options.declutterMode,
  });

  /**
   * @private
   * @type {Array<number>}
   */
  this.anchor_ = options.anchor !== undefined ? options.anchor : [0.5, 0.5];

  /**
   * @private
   * @type {Array<number>}
   */
  this.normalizedAnchor_ = null;

  /**
   * @private
   * @type {IconOrigin}
   */
  this.anchorOrigin_ =
    options.anchorOrigin !== undefined ? options.anchorOrigin : 'top-left';

  /**
   * @private
   * @type {IconAnchorUnits}
   */
  this.anchorXUnits_ =
    options.anchorXUnits !== undefined ? options.anchorXUnits : 'fraction';

  /**
   * @private
   * @type {IconAnchorUnits}
   */
  this.anchorYUnits_ =
    options.anchorYUnits !== undefined ? options.anchorYUnits : 'fraction';

  /**
   * @private
   * @type {?string}
   */
  this.crossOrigin_ =
    options.crossOrigin !== undefined ? options.crossOrigin : null;

  const image = options.img !== undefined ? options.img : null;

  let cacheKey = options.src;

  assert(
    !(cacheKey !== undefined && image),
    '`image` and `src` cannot be provided at the same time'
  );

  if ((cacheKey === undefined || cacheKey.length === 0) && image) {
    cacheKey = /** @type {HTMLImageElement} */ (image).src || getUid(image);
  }
  assert(
    cacheKey !== undefined && cacheKey.length > 0,
    'A defined and non-empty `src` or `image` must be provided'
  );

  assert(
    !(
      (options.width !== undefined || options.height !== undefined) &&
      options.scale !== undefined
    ),
    '`width` or `height` cannot be provided together with `scale`'
  );

  let imageState;
  if (options.src !== undefined) {
    imageState = ImageState.IDLE;
  } else if (image !== undefined) {
    if (image instanceof HTMLImageElement) {
      if (image.complete) {
        imageState = image.src ? ImageState.LOADED : ImageState.IDLE;
      } else {
        imageState = ImageState.LOADING;
      }
    } else {
      imageState = ImageState.LOADED;
    }
  }

  /**
   * @private
   * @type {import("../color.js").Color}
   */
  this.color_ = options.color !== undefined ? asArray(options.color) : null;

  /**
   * @private
   * @type {import("./IconImage.js").default}
   */
  this.iconImage_ = getIconImage(
    image,
    /** @type {string} */ (cacheKey),
    this.crossOrigin_,
    imageState,
    this.color_
  );

  /**
   * @private
   * @type {Array<number>}
   */
  this.offset_ = options.offset !== undefined ? options.offset : [0, 0];
  /**
   * @private
   * @type {IconOrigin}
   */
  this.offsetOrigin_ =
    options.offsetOrigin !== undefined ? options.offsetOrigin : 'top-left';

  /**
   * @private
   * @type {Array<number>}
   */
  this.origin_ = null;

  /**
   * @private
   * @type {import("../size.js").Size}
   */
  this.size_ = options.size !== undefined ? options.size : null;

  /**
   * Calculate the scale if width or height were given.
   */
  if (options.width !== undefined || options.height !== undefined) {
    let width, height;
    if (options.size) {
      [width, height] = options.size;
    } else {
      const image = this.getImage(1);
      if (image.width && image.height) {
        width = image.width;
        height = image.height;
      } else if (image instanceof HTMLImageElement) {
        this.initialOptions_ = options;
        const onload = () => {
          this.unlistenImageChange(onload);
          if (!this.initialOptions_) {
            return;
          }
          const imageSize = this.iconImage_.getSize();
          this.setScale(
            calculateScale(
              imageSize[0],
              imageSize[1],
              options.width,
              options.height
            )
          );
        };
        this.listenImageChange(onload);
        return;
      }
    }
    if (width !== undefined) {
      this.setScale(
        calculateScale(width, height, options.width, options.height)
      );
    }
  }
}
