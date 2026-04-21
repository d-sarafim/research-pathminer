setTextStyle(textStyle, sharedData) {
  let textState, fillState, strokeState;
  if (!textStyle) {
    this.text_ = '';
  } else {
    const textFillStyle = textStyle.getFill();
    if (!textFillStyle) {
      fillState = null;
      this.textFillState_ = fillState;
    } else {
      fillState = this.textFillState_;
      if (!fillState) {
        fillState = /** @type {import("../canvas.js").FillState} */ ({});
        this.textFillState_ = fillState;
      }
      fillState.fillStyle = asColorLike(
        textFillStyle.getColor() || defaultFillStyle
      );
    }

    const textStrokeStyle = textStyle.getStroke();
    if (!textStrokeStyle) {
      strokeState = null;
      this.textStrokeState_ = strokeState;
    } else {
      strokeState = this.textStrokeState_;
      if (!strokeState) {
        strokeState = /** @type {import("../canvas.js").StrokeState} */ ({});
        this.textStrokeState_ = strokeState;
      }
      const lineDash = textStrokeStyle.getLineDash();
      const lineDashOffset = textStrokeStyle.getLineDashOffset();
      const lineWidth = textStrokeStyle.getWidth();
      const miterLimit = textStrokeStyle.getMiterLimit();
      strokeState.lineCap = textStrokeStyle.getLineCap() || defaultLineCap;
      strokeState.lineDash = lineDash ? lineDash.slice() : defaultLineDash;
      strokeState.lineDashOffset =
        lineDashOffset === undefined ? defaultLineDashOffset : lineDashOffset;
      strokeState.lineJoin = textStrokeStyle.getLineJoin() || defaultLineJoin;
      strokeState.lineWidth =
        lineWidth === undefined ? defaultLineWidth : lineWidth;
      strokeState.miterLimit =
        miterLimit === undefined ? defaultMiterLimit : miterLimit;
      strokeState.strokeStyle = asColorLike(
        textStrokeStyle.getColor() || defaultStrokeStyle
      );
    }

    textState = this.textState_;
    const font = textStyle.getFont() || defaultFont;
    registerFont(font);
    const textScale = textStyle.getScaleArray();
    textState.overflow = textStyle.getOverflow();
    textState.font = font;
    textState.maxAngle = textStyle.getMaxAngle();
    textState.placement = textStyle.getPlacement();
    textState.textAlign = textStyle.getTextAlign();
    textState.repeat = textStyle.getRepeat();
    textState.justify = textStyle.getJustify();
    textState.textBaseline =
      textStyle.getTextBaseline() || defaultTextBaseline;
    textState.backgroundFill = textStyle.getBackgroundFill();
    textState.backgroundStroke = textStyle.getBackgroundStroke();
    textState.padding = textStyle.getPadding() || defaultPadding;
    textState.scale = textScale === undefined ? [1, 1] : textScale;

    const textOffsetX = textStyle.getOffsetX();
    const textOffsetY = textStyle.getOffsetY();
    const textRotateWithView = textStyle.getRotateWithView();
    const textRotation = textStyle.getRotation();
    this.text_ = textStyle.getText() || '';
    this.textOffsetX_ = textOffsetX === undefined ? 0 : textOffsetX;
    this.textOffsetY_ = textOffsetY === undefined ? 0 : textOffsetY;
    this.textRotateWithView_ =
      textRotateWithView === undefined ? false : textRotateWithView;
    this.textRotation_ = textRotation === undefined ? 0 : textRotation;

    this.strokeKey_ = strokeState
      ? (typeof strokeState.strokeStyle == 'string'
          ? strokeState.strokeStyle
          : getUid(strokeState.strokeStyle)) +
        strokeState.lineCap +
        strokeState.lineDashOffset +
        '|' +
        strokeState.lineWidth +
        strokeState.lineJoin +
        strokeState.miterLimit +
        '[' +
        strokeState.lineDash.join() +
        ']'
      : '';
    this.textKey_ =
      textState.font +
      textState.scale +
      (textState.textAlign || '?') +
      (textState.repeat || '?') +
      (textState.justify || '?') +
      (textState.textBaseline || '?');
    this.fillKey_ = fillState
      ? typeof fillState.fillStyle == 'string'
        ? fillState.fillStyle
        : '|' + getUid(fillState.fillStyle)
      : '';
  }
  this.declutterImageWithText_ = sharedData;
}
