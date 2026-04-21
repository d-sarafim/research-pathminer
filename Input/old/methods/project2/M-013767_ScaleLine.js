updateElement_() {
  const viewState = this.viewState_;

  if (!viewState) {
    if (this.renderedVisible_) {
      this.element.style.display = 'none';
      this.renderedVisible_ = false;
    }
    return;
  }

  const center = viewState.center;
  const projection = viewState.projection;
  const units = this.getUnits();
  const pointResolutionUnits = units == 'degrees' ? 'degrees' : 'm';
  let pointResolution = getPointResolution(
    projection,
    viewState.resolution,
    center,
    pointResolutionUnits
  );

  const minWidth =
    (this.minWidth_ * (this.dpi_ || DEFAULT_DPI)) / DEFAULT_DPI;

  const maxWidth =
    this.maxWidth_ !== undefined
      ? (this.maxWidth_ * (this.dpi_ || DEFAULT_DPI)) / DEFAULT_DPI
      : undefined;

  let nominalCount = minWidth * pointResolution;
  let suffix = '';
  if (units == 'degrees') {
    const metersPerDegree = METERS_PER_UNIT.degrees;
    nominalCount *= metersPerDegree;
    if (nominalCount < metersPerDegree / 60) {
      suffix = '\u2033'; // seconds
      pointResolution *= 3600;
    } else if (nominalCount < metersPerDegree) {
      suffix = '\u2032'; // minutes
      pointResolution *= 60;
    } else {
      suffix = '\u00b0'; // degrees
    }
  } else if (units == 'imperial') {
    if (nominalCount < 0.9144) {
      suffix = 'in';
      pointResolution /= 0.0254;
    } else if (nominalCount < 1609.344) {
      suffix = 'ft';
      pointResolution /= 0.3048;
    } else {
      suffix = 'mi';
      pointResolution /= 1609.344;
    }
  } else if (units == 'nautical') {
    pointResolution /= 1852;
    suffix = 'NM';
  } else if (units == 'metric') {
    if (nominalCount < 0.001) {
      suffix = 'μm';
      pointResolution *= 1000000;
    } else if (nominalCount < 1) {
      suffix = 'mm';
      pointResolution *= 1000;
    } else if (nominalCount < 1000) {
      suffix = 'm';
    } else {
      suffix = 'km';
      pointResolution /= 1000;
    }
  } else if (units == 'us') {
    if (nominalCount < 0.9144) {
      suffix = 'in';
      pointResolution *= 39.37;
    } else if (nominalCount < 1609.344) {
      suffix = 'ft';
      pointResolution /= 0.30480061;
    } else {
      suffix = 'mi';
      pointResolution /= 1609.3472;
    }
  } else {
    throw new Error('Invalid units');
  }

  let i = 3 * Math.floor(Math.log(minWidth * pointResolution) / Math.log(10));
  let count, width, decimalCount;
  let previousCount, previousWidth, previousDecimalCount;
  while (true) {
    decimalCount = Math.floor(i / 3);
    const decimal = Math.pow(10, decimalCount);
    count = LEADING_DIGITS[((i % 3) + 3) % 3] * decimal;
    width = Math.round(count / pointResolution);
    if (isNaN(width)) {
      this.element.style.display = 'none';
      this.renderedVisible_ = false;
      return;
    }
    if (maxWidth !== undefined && width >= maxWidth) {
      count = previousCount;
      width = previousWidth;
      decimalCount = previousDecimalCount;
      break;
    } else if (width >= minWidth) {
      break;
    }
    previousCount = count;
    previousWidth = width;
    previousDecimalCount = decimalCount;
    ++i;
  }
  const html = this.scaleBar_
    ? this.createScaleBar(width, count, suffix)
    : count.toFixed(decimalCount < 0 ? -decimalCount : 0) + ' ' + suffix;

  if (this.renderedHTML_ != html) {
    this.innerElement_.innerHTML = html;
    this.renderedHTML_ = html;
  }

  if (this.renderedWidth_ != width) {
    this.innerElement_.style.width = width + 'px';
    this.renderedWidth_ = width;
  }

  if (!this.renderedVisible_) {
    this.element.style.display = '';
    this.renderedVisible_ = true;
  }
}
