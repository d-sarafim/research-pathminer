_computeGridLineItems(chartArea) {
  const axis = this.axis;
  const chart = this.chart;
  const options = this.options;
  const {grid, position, border} = options;
  const offset = grid.offset;
  const isHorizontal = this.isHorizontal();
  const ticks = this.ticks;
  const ticksLength = ticks.length + (offset ? 1 : 0);
  const tl = getTickMarkLength(grid);
  const items = [];

  const borderOpts = border.setContext(this.getContext());
  const axisWidth = borderOpts.display ? borderOpts.width : 0;
  const axisHalfWidth = axisWidth / 2;
  const alignBorderValue = function(pixel) {
    return _alignPixel(chart, pixel, axisWidth);
  };
  let borderValue, i, lineValue, alignedLineValue;
  let tx1, ty1, tx2, ty2, x1, y1, x2, y2;

  if (position === 'top') {
    borderValue = alignBorderValue(this.bottom);
    ty1 = this.bottom - tl;
    ty2 = borderValue - axisHalfWidth;
    y1 = alignBorderValue(chartArea.top) + axisHalfWidth;
    y2 = chartArea.bottom;
  } else if (position === 'bottom') {
    borderValue = alignBorderValue(this.top);
    y1 = chartArea.top;
    y2 = alignBorderValue(chartArea.bottom) - axisHalfWidth;
    ty1 = borderValue + axisHalfWidth;
    ty2 = this.top + tl;
  } else if (position === 'left') {
    borderValue = alignBorderValue(this.right);
    tx1 = this.right - tl;
    tx2 = borderValue - axisHalfWidth;
    x1 = alignBorderValue(chartArea.left) + axisHalfWidth;
    x2 = chartArea.right;
  } else if (position === 'right') {
    borderValue = alignBorderValue(this.left);
    x1 = chartArea.left;
    x2 = alignBorderValue(chartArea.right) - axisHalfWidth;
    tx1 = borderValue + axisHalfWidth;
    tx2 = this.left + tl;
  } else if (axis === 'x') {
    if (position === 'center') {
      borderValue = alignBorderValue((chartArea.top + chartArea.bottom) / 2 + 0.5);
    } else if (isObject(position)) {
      const positionAxisID = Object.keys(position)[0];
      const value = position[positionAxisID];
      borderValue = alignBorderValue(this.chart.scales[positionAxisID].getPixelForValue(value));
    }

    y1 = chartArea.top;
    y2 = chartArea.bottom;
    ty1 = borderValue + axisHalfWidth;
    ty2 = ty1 + tl;
  } else if (axis === 'y') {
    if (position === 'center') {
      borderValue = alignBorderValue((chartArea.left + chartArea.right) / 2);
    } else if (isObject(position)) {
      const positionAxisID = Object.keys(position)[0];
      const value = position[positionAxisID];
      borderValue = alignBorderValue(this.chart.scales[positionAxisID].getPixelForValue(value));
    }

    tx1 = borderValue - axisHalfWidth;
    tx2 = tx1 - tl;
    x1 = chartArea.left;
    x2 = chartArea.right;
  }

  const limit = valueOrDefault(options.ticks.maxTicksLimit, ticksLength);
  const step = Math.max(1, Math.ceil(ticksLength / limit));
  for (i = 0; i < ticksLength; i += step) {
    const context = this.getContext(i);
    const optsAtIndex = grid.setContext(context);
    const optsAtIndexBorder = border.setContext(context);

    const lineWidth = optsAtIndex.lineWidth;
    const lineColor = optsAtIndex.color;
    const borderDash = optsAtIndexBorder.dash || [];
    const borderDashOffset = optsAtIndexBorder.dashOffset;

    const tickWidth = optsAtIndex.tickWidth;
    const tickColor = optsAtIndex.tickColor;
    const tickBorderDash = optsAtIndex.tickBorderDash || [];
    const tickBorderDashOffset = optsAtIndex.tickBorderDashOffset;

    lineValue = getPixelForGridLine(this, i, offset);

    // Skip if the pixel is out of the range
    if (lineValue === undefined) {
      continue;
    }

    alignedLineValue = _alignPixel(chart, lineValue, lineWidth);

    if (isHorizontal) {
      tx1 = tx2 = x1 = x2 = alignedLineValue;
    } else {
      ty1 = ty2 = y1 = y2 = alignedLineValue;
    }

    items.push({
      tx1,
      ty1,
      tx2,
      ty2,
      x1,
      y1,
      x2,
      y2,
      width: lineWidth,
      color: lineColor,
      borderDash,
      borderDashOffset,
      tickWidth,
      tickColor,
      tickBorderDash,
      tickBorderDashOffset,
    });
  }

  this._ticksLength = ticksLength;
  this._borderValue = borderValue;

  return items;
}
