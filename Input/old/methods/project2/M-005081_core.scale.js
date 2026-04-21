_computeLabelItems(chartArea) {
  const axis = this.axis;
  const options = this.options;
  const {position, ticks: optionTicks} = options;
  const isHorizontal = this.isHorizontal();
  const ticks = this.ticks;
  const {align, crossAlign, padding, mirror} = optionTicks;
  const tl = getTickMarkLength(options.grid);
  const tickAndPadding = tl + padding;
  const hTickAndPadding = mirror ? -padding : tickAndPadding;
  const rotation = -toRadians(this.labelRotation);
  const items = [];
  let i, ilen, tick, label, x, y, textAlign, pixel, font, lineHeight, lineCount, textOffset;
  let textBaseline = 'middle';

  if (position === 'top') {
    y = this.bottom - hTickAndPadding;
    textAlign = this._getXAxisLabelAlignment();
  } else if (position === 'bottom') {
    y = this.top + hTickAndPadding;
    textAlign = this._getXAxisLabelAlignment();
  } else if (position === 'left') {
    const ret = this._getYAxisLabelAlignment(tl);
    textAlign = ret.textAlign;
    x = ret.x;
  } else if (position === 'right') {
    const ret = this._getYAxisLabelAlignment(tl);
    textAlign = ret.textAlign;
    x = ret.x;
  } else if (axis === 'x') {
    if (position === 'center') {
      y = ((chartArea.top + chartArea.bottom) / 2) + tickAndPadding;
    } else if (isObject(position)) {
      const positionAxisID = Object.keys(position)[0];
      const value = position[positionAxisID];
      y = this.chart.scales[positionAxisID].getPixelForValue(value) + tickAndPadding;
    }
    textAlign = this._getXAxisLabelAlignment();
  } else if (axis === 'y') {
    if (position === 'center') {
      x = ((chartArea.left + chartArea.right) / 2) - tickAndPadding;
    } else if (isObject(position)) {
      const positionAxisID = Object.keys(position)[0];
      const value = position[positionAxisID];
      x = this.chart.scales[positionAxisID].getPixelForValue(value);
    }
    textAlign = this._getYAxisLabelAlignment(tl).textAlign;
  }

  if (axis === 'y') {
    if (align === 'start') {
      textBaseline = 'top';
    } else if (align === 'end') {
      textBaseline = 'bottom';
    }
  }

  const labelSizes = this._getLabelSizes();
  for (i = 0, ilen = ticks.length; i < ilen; ++i) {
    tick = ticks[i];
    label = tick.label;

    const optsAtIndex = optionTicks.setContext(this.getContext(i));
    pixel = this.getPixelForTick(i) + optionTicks.labelOffset;
    font = this._resolveTickFontOptions(i);
    lineHeight = font.lineHeight;
    lineCount = isArray(label) ? label.length : 1;
    const halfCount = lineCount / 2;
    const color = optsAtIndex.color;
    const strokeColor = optsAtIndex.textStrokeColor;
    const strokeWidth = optsAtIndex.textStrokeWidth;
    let tickTextAlign = textAlign;

    if (isHorizontal) {
      x = pixel;

      if (textAlign === 'inner') {
        if (i === ilen - 1) {
          tickTextAlign = !this.options.reverse ? 'right' : 'left';
        } else if (i === 0) {
          tickTextAlign = !this.options.reverse ? 'left' : 'right';
        } else {
          tickTextAlign = 'center';
        }
      }

      if (position === 'top') {
        if (crossAlign === 'near' || rotation !== 0) {
          textOffset = -lineCount * lineHeight + lineHeight / 2;
        } else if (crossAlign === 'center') {
          textOffset = -labelSizes.highest.height / 2 - halfCount * lineHeight + lineHeight;
        } else {
          textOffset = -labelSizes.highest.height + lineHeight / 2;
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (crossAlign === 'near' || rotation !== 0) {
          textOffset = lineHeight / 2;
        } else if (crossAlign === 'center') {
          textOffset = labelSizes.highest.height / 2 - halfCount * lineHeight;
        } else {
          textOffset = labelSizes.highest.height - lineCount * lineHeight;
        }
      }
      if (mirror) {
        textOffset *= -1;
      }
      if (rotation !== 0 && !optsAtIndex.showLabelBackdrop) {
        x += (lineHeight / 2) * Math.sin(rotation);
      }
    } else {
      y = pixel;
      textOffset = (1 - lineCount) * lineHeight / 2;
    }

    let backdrop;

    if (optsAtIndex.showLabelBackdrop) {
      const labelPadding = toPadding(optsAtIndex.backdropPadding);
      const height = labelSizes.heights[i];
      const width = labelSizes.widths[i];

      let top = textOffset - labelPadding.top;
      let left = 0 - labelPadding.left;

      switch (textBaseline) {
      case 'middle':
        top -= height / 2;
        break;
      case 'bottom':
        top -= height;
        break;
      default:
        break;
      }

      switch (textAlign) {
      case 'center':
        left -= width / 2;
        break;
      case 'right':
        left -= width;
        break;
      default:
        break;
      }

      backdrop = {
        left,
        top,
        width: width + labelPadding.width,
        height: height + labelPadding.height,

        color: optsAtIndex.backdropColor,
      };
    }

    items.push({
      label,
      font,
      textOffset,
      options: {
        rotation,
        color,
        strokeColor,
        strokeWidth,
        textAlign: tickTextAlign,
        textBaseline,
        translation: [x, y],
        backdrop,
      }
    });
  }

  return items;
}
