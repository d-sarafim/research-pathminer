export class Tooltip extends Element {

  /**
   * @namespace Chart.Tooltip.positioners
   */
  static positioners = positioners;

  constructor(config) {
    super();

    this.opacity = 0;
    this._active = [];
    this._eventPosition = undefined;
    this._size = undefined;
    this._cachedAnimations = undefined;
    this._tooltipItems = [];
    this.$animations = undefined;
    this.$context = undefined;
    this.chart = config.chart;
    this.options = config.options;
    this.dataPoints = undefined;
    this.title = undefined;
    this.beforeBody = undefined;
    this.body = undefined;
    this.afterBody = undefined;
    this.footer = undefined;
    this.xAlign = undefined;
    this.yAlign = undefined;
    this.x = undefined;
    this.y = undefined;
    this.height = undefined;
    this.width = undefined;
    this.caretX = undefined;
    this.caretY = undefined;
    // TODO: V4, make this private, rename to `_labelStyles`, and combine with `labelPointStyles`
    // and `labelTextColors` to create a single variable
    this.labelColors = undefined;
    this.labelPointStyles = undefined;
    this.labelTextColors = undefined;
  }

  initialize(options) {
    this.options = options;
    this._cachedAnimations = undefined;
    this.$context = undefined;
  }

  /**
	 * @private
	 */
  _resolveAnimations() {
    const cached = this._cachedAnimations;

    if (cached) {
      return cached;
    }

    const chart = this.chart;
    const options = this.options.setContext(this.getContext());
    const opts = options.enabled && chart.options.animation && options.animations;
    const animations = new Animations(this.chart, opts);
    if (opts._cacheable) {
      this._cachedAnimations = Object.freeze(animations);
    }

    return animations;
  }

  /**
	 * @protected
	 */
  getContext() {
    return this.$context ||
			(this.$context = createTooltipContext(this.chart.getContext(), this, this._tooltipItems));
  }

  getTitle(context, options) {
    const {callbacks} = options;

    const beforeTitle = invokeCallbackWithFallback(callbacks, 'beforeTitle', this, context);
    const title = invokeCallbackWithFallback(callbacks, 'title', this, context);
    const afterTitle = invokeCallbackWithFallback(callbacks, 'afterTitle', this, context);

    let lines = [];
    lines = pushOrConcat(lines, splitNewlines(beforeTitle));
    lines = pushOrConcat(lines, splitNewlines(title));
    lines = pushOrConcat(lines, splitNewlines(afterTitle));

    return lines;
  }

  getBeforeBody(tooltipItems, options) {
    return getBeforeAfterBodyLines(
      invokeCallbackWithFallback(options.callbacks, 'beforeBody', this, tooltipItems)
    );
  }

  getBody(tooltipItems, options) {
    const {callbacks} = options;
    const bodyItems = [];

    each(tooltipItems, (context) => {
      const bodyItem = {
        before: [],
        lines: [],
        after: []
      };
      const scoped = overrideCallbacks(callbacks, context);
      pushOrConcat(bodyItem.before, splitNewlines(invokeCallbackWithFallback(scoped, 'beforeLabel', this, context)));
      pushOrConcat(bodyItem.lines, invokeCallbackWithFallback(scoped, 'label', this, context));
      pushOrConcat(bodyItem.after, splitNewlines(invokeCallbackWithFallback(scoped, 'afterLabel', this, context)));

      bodyItems.push(bodyItem);
    });

    return bodyItems;
  }

  getAfterBody(tooltipItems, options) {
    return getBeforeAfterBodyLines(
      invokeCallbackWithFallback(options.callbacks, 'afterBody', this, tooltipItems)
    );
  }

  // Get the footer and beforeFooter and afterFooter lines
  getFooter(tooltipItems, options) {
    const {callbacks} = options;

    const beforeFooter = invokeCallbackWithFallback(callbacks, 'beforeFooter', this, tooltipItems);
    const footer = invokeCallbackWithFallback(callbacks, 'footer', this, tooltipItems);
    const afterFooter = invokeCallbackWithFallback(callbacks, 'afterFooter', this, tooltipItems);

    let lines = [];
    lines = pushOrConcat(lines, splitNewlines(beforeFooter));
    lines = pushOrConcat(lines, splitNewlines(footer));
    lines = pushOrConcat(lines, splitNewlines(afterFooter));

    return lines;
  }

  /**
	 * @private
	 */
  _createItems(options) {
    const active = this._active;
    const data = this.chart.data;
    const labelColors = [];
    const labelPointStyles = [];
    const labelTextColors = [];
    let tooltipItems = [];
    let i, len;

    for (i = 0, len = active.length; i < len; ++i) {
      tooltipItems.push(createTooltipItem(this.chart, active[i]));
    }

    // If the user provided a filter function, use it to modify the tooltip items
    if (options.filter) {
      tooltipItems = tooltipItems.filter((element, index, array) => options.filter(element, index, array, data));
    }

    // If the user provided a sorting function, use it to modify the tooltip items
    if (options.itemSort) {
      tooltipItems = tooltipItems.sort((a, b) => options.itemSort(a, b, data));
    }

    // Determine colors for boxes
    each(tooltipItems, (context) => {
      const scoped = overrideCallbacks(options.callbacks, context);
      labelColors.push(invokeCallbackWithFallback(scoped, 'labelColor', this, context));
      labelPointStyles.push(invokeCallbackWithFallback(scoped, 'labelPointStyle', this, context));
      labelTextColors.push(invokeCallbackWithFallback(scoped, 'labelTextColor', this, context));
    });

    this.labelColors = labelColors;
    this.labelPointStyles = labelPointStyles;
    this.labelTextColors = labelTextColors;
    this.dataPoints = tooltipItems;
    return tooltipItems;
  }

  update(changed, replay) {
    const options = this.options.setContext(this.getContext());
    const active = this._active;
    let properties;
    let tooltipItems = [];

    if (!active.length) {
      if (this.opacity !== 0) {
        properties = {
          opacity: 0
        };
      }
    } else {
      const position = positioners[options.position].call(this, active, this._eventPosition);
      tooltipItems = this._createItems(options);

      this.title = this.getTitle(tooltipItems, options);
      this.beforeBody = this.getBeforeBody(tooltipItems, options);
      this.body = this.getBody(tooltipItems, options);
      this.afterBody = this.getAfterBody(tooltipItems, options);
      this.footer = this.getFooter(tooltipItems, options);

      const size = this._size = getTooltipSize(this, options);
      const positionAndSize = Object.assign({}, position, size);
      const alignment = determineAlignment(this.chart, options, positionAndSize);
      const backgroundPoint = getBackgroundPoint(options, positionAndSize, alignment, this.chart);

      this.xAlign = alignment.xAlign;
      this.yAlign = alignment.yAlign;

      properties = {
        opacity: 1,
        x: backgroundPoint.x,
        y: backgroundPoint.y,
        width: size.width,
        height: size.height,
        caretX: position.x,
        caretY: position.y
      };
    }

    this._tooltipItems = tooltipItems;
    this.$context = undefined;

    if (properties) {
      this._resolveAnimations().update(this, properties);
    }

    if (changed && options.external) {
      options.external.call(this, {chart: this.chart, tooltip: this, replay});
    }
  }

  drawCaret(tooltipPoint, ctx, size, options) {
    const caretPosition = this.getCaretPosition(tooltipPoint, size, options);

    ctx.lineTo(caretPosition.x1, caretPosition.y1);
    ctx.lineTo(caretPosition.x2, caretPosition.y2);
    ctx.lineTo(caretPosition.x3, caretPosition.y3);
  }

  getCaretPosition(tooltipPoint, size, options) {
    const {xAlign, yAlign} = this;
    const {caretSize, cornerRadius} = options;
    const {topLeft, topRight, bottomLeft, bottomRight} = toTRBLCorners(cornerRadius);
    const {x: ptX, y: ptY} = tooltipPoint;
    const {width, height} = size;
    let x1, x2, x3, y1, y2, y3;

    if (yAlign === 'center') {
      y2 = ptY + (height / 2);

      if (xAlign === 'left') {
        x1 = ptX;
        x2 = x1 - caretSize;

        // Left draws bottom -> top, this y1 is on the bottom
        y1 = y2 + caretSize;
        y3 = y2 - caretSize;
      } else {
        x1 = ptX + width;
        x2 = x1 + caretSize;

        // Right draws top -> bottom, thus y1 is on the top
        y1 = y2 - caretSize;
        y3 = y2 + caretSize;
      }

      x3 = x1;
    } else {
      if (xAlign === 'left') {
        x2 = ptX + Math.max(topLeft, bottomLeft) + (caretSize);
      } else if (xAlign === 'right') {
        x2 = ptX + width - Math.max(topRight, bottomRight) - caretSize;
      } else {
        x2 = this.caretX;
      }

      if (yAlign === 'top') {
        y1 = ptY;
        y2 = y1 - caretSize;

        // Top draws left -> right, thus x1 is on the left
        x1 = x2 - caretSize;
        x3 = x2 + caretSize;
      } else {
        y1 = ptY + height;
        y2 = y1 + caretSize;

        // Bottom draws right -> left, thus x1 is on the right
        x1 = x2 + caretSize;
        x3 = x2 - caretSize;
      }
      y3 = y1;
    }
    return {x1, x2, x3, y1, y2, y3};
  }

  drawTitle(pt, ctx, options) {
    const title = this.title;
    const length = title.length;
    let titleFont, titleSpacing, i;

    if (length) {
      const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);

      pt.x = getAlignedX(this, options.titleAlign, options);

      ctx.textAlign = rtlHelper.textAlign(options.titleAlign);
      ctx.textBaseline = 'middle';

      titleFont = toFont(options.titleFont);
      titleSpacing = options.titleSpacing;

      ctx.fillStyle = options.titleColor;
      ctx.font = titleFont.string;

      for (i = 0; i < length; ++i) {
        ctx.fillText(title[i], rtlHelper.x(pt.x), pt.y + titleFont.lineHeight / 2);
        pt.y += titleFont.lineHeight + titleSpacing; // Line Height and spacing

        if (i + 1 === length) {
          pt.y += options.titleMarginBottom - titleSpacing; // If Last, add margin, remove spacing
        }
      }
    }
  }

  /**
	 * @private
	 */
  _drawColorBox(ctx, pt, i, rtlHelper, options) {
    const labelColor = this.labelColors[i];
    const labelPointStyle = this.labelPointStyles[i];
    const {boxHeight, boxWidth} = options;
    const bodyFont = toFont(options.bodyFont);
    const colorX = getAlignedX(this, 'left', options);
    const rtlColorX = rtlHelper.x(colorX);
    const yOffSet = boxHeight < bodyFont.lineHeight ? (bodyFont.lineHeight - boxHeight) / 2 : 0;
    const colorY = pt.y + yOffSet;

    if (options.usePointStyle) {
      const drawOptions = {
        radius: Math.min(boxWidth, boxHeight) / 2, // fit the circle in the box
        pointStyle: labelPointStyle.pointStyle,
        rotation: labelPointStyle.rotation,
        borderWidth: 1
      };
      // Recalculate x and y for drawPoint() because its expecting
      // x and y to be center of figure (instead of top left)
      const centerX = rtlHelper.leftForLtr(rtlColorX, boxWidth) + boxWidth / 2;
      const centerY = colorY + boxHeight / 2;

      // Fill the point with white so that colours merge nicely if the opacity is < 1
      ctx.strokeStyle = options.multiKeyBackground;
      ctx.fillStyle = options.multiKeyBackground;
      drawPoint(ctx, drawOptions, centerX, centerY);

      // Draw the point
      ctx.strokeStyle = labelColor.borderColor;
      ctx.fillStyle = labelColor.backgroundColor;
      drawPoint(ctx, drawOptions, centerX, centerY);
    } else {
      // Border
      ctx.lineWidth = isObject(labelColor.borderWidth) ? Math.max(...Object.values(labelColor.borderWidth)) : (labelColor.borderWidth || 1); // TODO, v4 remove fallback
      ctx.strokeStyle = labelColor.borderColor;
      ctx.setLineDash(labelColor.borderDash || []);
      ctx.lineDashOffset = labelColor.borderDashOffset || 0;

      // Fill a white rect so that colours merge nicely if the opacity is < 1
      const outerX = rtlHelper.leftForLtr(rtlColorX, boxWidth);
      const innerX = rtlHelper.leftForLtr(rtlHelper.xPlus(rtlColorX, 1), boxWidth - 2);
      const borderRadius = toTRBLCorners(labelColor.borderRadius);

      if (Object.values(borderRadius).some(v => v !== 0)) {
        ctx.beginPath();
        ctx.fillStyle = options.multiKeyBackground;
        addRoundedRectPath(ctx, {
          x: outerX,
          y: colorY,
          w: boxWidth,
          h: boxHeight,
          radius: borderRadius,
        });
        ctx.fill();
        ctx.stroke();

        // Inner square
        ctx.fillStyle = labelColor.backgroundColor;
        ctx.beginPath();
        addRoundedRectPath(ctx, {
          x: innerX,
          y: colorY + 1,
          w: boxWidth - 2,
          h: boxHeight - 2,
          radius: borderRadius,
        });
        ctx.fill();
      } else {
        // Normal rect
        ctx.fillStyle = options.multiKeyBackground;
        ctx.fillRect(outerX, colorY, boxWidth, boxHeight);
        ctx.strokeRect(outerX, colorY, boxWidth, boxHeight);
        // Inner square
        ctx.fillStyle = labelColor.backgroundColor;
        ctx.fillRect(innerX, colorY + 1, boxWidth - 2, boxHeight - 2);
      }
    }

    // restore fillStyle
    ctx.fillStyle = this.labelTextColors[i];
  }

  drawBody(pt, ctx, options) {
    const {body} = this;
    const {bodySpacing, bodyAlign, displayColors, boxHeight, boxWidth, boxPadding} = options;
    const bodyFont = toFont(options.bodyFont);
    let bodyLineHeight = bodyFont.lineHeight;
    let xLinePadding = 0;

    const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);

    const fillLineOfText = function(line) {
      ctx.fillText(line, rtlHelper.x(pt.x + xLinePadding), pt.y + bodyLineHeight / 2);
      pt.y += bodyLineHeight + bodySpacing;
    };

    const bodyAlignForCalculation = rtlHelper.textAlign(bodyAlign);
    let bodyItem, textColor, lines, i, j, ilen, jlen;

    ctx.textAlign = bodyAlign;
    ctx.textBaseline = 'middle';
    ctx.font = bodyFont.string;

    pt.x = getAlignedX(this, bodyAlignForCalculation, options);

    // Before body lines
    ctx.fillStyle = options.bodyColor;
    each(this.beforeBody, fillLineOfText);

    xLinePadding = displayColors && bodyAlignForCalculation !== 'right'
      ? bodyAlign === 'center' ? (boxWidth / 2 + boxPadding) : (boxWidth + 2 + boxPadding)
      : 0;

    // Draw body lines now
    for (i = 0, ilen = body.length; i < ilen; ++i) {
      bodyItem = body[i];
      textColor = this.labelTextColors[i];

      ctx.fillStyle = textColor;
      each(bodyItem.before, fillLineOfText);

      lines = bodyItem.lines;
      // Draw Legend-like boxes if needed
      if (displayColors && lines.length) {
        this._drawColorBox(ctx, pt, i, rtlHelper, options);
        bodyLineHeight = Math.max(bodyFont.lineHeight, boxHeight);
      }

      for (j = 0, jlen = lines.length; j < jlen; ++j) {
        fillLineOfText(lines[j]);
        // Reset for any lines that don't include colorbox
        bodyLineHeight = bodyFont.lineHeight;
      }

      each(bodyItem.after, fillLineOfText);
    }

    // Reset back to 0 for after body
    xLinePadding = 0;
    bodyLineHeight = bodyFont.lineHeight;

    // After body lines
    each(this.afterBody, fillLineOfText);
    pt.y -= bodySpacing; // Remove last body spacing
  }

  drawFooter(pt, ctx, options) {
    const footer = this.footer;
    const length = footer.length;
    let footerFont, i;

    if (length) {
      const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);

      pt.x = getAlignedX(this, options.footerAlign, options);
      pt.y += options.footerMarginTop;

      ctx.textAlign = rtlHelper.textAlign(options.footerAlign);
      ctx.textBaseline = 'middle';

      footerFont = toFont(options.footerFont);

      ctx.fillStyle = options.footerColor;
      ctx.font = footerFont.string;

      for (i = 0; i < length; ++i) {
        ctx.fillText(footer[i], rtlHelper.x(pt.x), pt.y + footerFont.lineHeight / 2);
        pt.y += footerFont.lineHeight + options.footerSpacing;
      }
    }
  }

  drawBackground(pt, ctx, tooltipSize, options) {
    const {xAlign, yAlign} = this;
    const {x, y} = pt;
    const {width, height} = tooltipSize;
    const {topLeft, topRight, bottomLeft, bottomRight} = toTRBLCorners(options.cornerRadius);

    ctx.fillStyle = options.backgroundColor;
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth;

    ctx.beginPath();
    ctx.moveTo(x + topLeft, y);
    if (yAlign === 'top') {
      this.drawCaret(pt, ctx, tooltipSize, options);
    }
    ctx.lineTo(x + width - topRight, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + topRight);
    if (yAlign === 'center' && xAlign === 'right') {
      this.drawCaret(pt, ctx, tooltipSize, options);
    }
    ctx.lineTo(x + width, y + height - bottomRight);
    ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
    if (yAlign === 'bottom') {
      this.drawCaret(pt, ctx, tooltipSize, options);
    }
    ctx.lineTo(x + bottomLeft, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
    if (yAlign === 'center' && xAlign === 'left') {
      this.drawCaret(pt, ctx, tooltipSize, options);
    }
    ctx.lineTo(x, y + topLeft);
    ctx.quadraticCurveTo(x, y, x + topLeft, y);
    ctx.closePath();

    ctx.fill();

    if (options.borderWidth > 0) {
      ctx.stroke();
    }
  }

  /**
	 * Update x/y animation targets when _active elements are animating too
	 * @private
	 */
  _updateAnimationTarget(options) {
    const chart = this.chart;
    const anims = this.$animations;
    const animX = anims && anims.x;
    const animY = anims && anims.y;
    if (animX || animY) {
      const position = positioners[options.position].call(this, this._active, this._eventPosition);
      if (!position) {
        return;
      }
      const size = this._size = getTooltipSize(this, options);
      const positionAndSize = Object.assign({}, position, this._size);
      const alignment = determineAlignment(chart, options, positionAndSize);
      const point = getBackgroundPoint(options, positionAndSize, alignment, chart);
      if (animX._to !== point.x || animY._to !== point.y) {
        this.xAlign = alignment.xAlign;
        this.yAlign = alignment.yAlign;
        this.width = size.width;
        this.height = size.height;
        this.caretX = position.x;
        this.caretY = position.y;
        this._resolveAnimations().update(this, point);
      }
    }
  }

  /**
   * Determine if the tooltip will draw anything
   * @returns {boolean} True if the tooltip will render
   */
  _willRender() {
    return !!this.opacity;
  }

  draw(ctx) {
    const options = this.options.setContext(this.getContext());
    let opacity = this.opacity;

    if (!opacity) {
      return;
    }

    this._updateAnimationTarget(options);

    const tooltipSize = {
      width: this.width,
      height: this.height
    };
    const pt = {
      x: this.x,
      y: this.y
    };

    // IE11/Edge does not like very small opacities, so snap to 0
    opacity = Math.abs(opacity) < 1e-3 ? 0 : opacity;

    const padding = toPadding(options.padding);

    // Truthy/falsey value for empty tooltip
    const hasTooltipContent = this.title.length || this.beforeBody.length || this.body.length || this.afterBody.length || this.footer.length;

    if (options.enabled && hasTooltipContent) {
      ctx.save();
      ctx.globalAlpha = opacity;

      // Draw Background
      this.drawBackground(pt, ctx, tooltipSize, options);

      overrideTextDirection(ctx, options.textDirection);

      pt.y += padding.top;

      // Titles
      this.drawTitle(pt, ctx, options);

      // Body
      this.drawBody(pt, ctx, options);

      // Footer
      this.drawFooter(pt, ctx, options);

      restoreTextDirection(ctx, options.textDirection);

      ctx.restore();
    }
  }

  /**
	 * Get active elements in the tooltip
	 * @returns {Array} Array of elements that are active in the tooltip
	 */
  getActiveElements() {
    return this._active || [];
  }

  /**
	 * Set active elements in the tooltip
	 * @param {array} activeElements Array of active datasetIndex/index pairs.
	 * @param {object} eventPosition Synthetic event position used in positioning
	 */
  setActiveElements(activeElements, eventPosition) {
    const lastActive = this._active;
    const active = activeElements.map(({datasetIndex, index}) => {
      const meta = this.chart.getDatasetMeta(datasetIndex);

      if (!meta) {
        throw new Error('Cannot find a dataset at index ' + datasetIndex);
      }

      return {
        datasetIndex,
        element: meta.data[index],
        index,
      };
    });
    const changed = !_elementsEqual(lastActive, active);
    const positionChanged = this._positionChanged(active, eventPosition);

    if (changed || positionChanged) {
      this._active = active;
      this._eventPosition = eventPosition;
      this._ignoreReplayEvents = true;
      this.update(true);
    }
  }

  /**
	 * Handle an event
	 * @param {ChartEvent} e - The event to handle
	 * @param {boolean} [replay] - This is a replayed event (from update)
	 * @param {boolean} [inChartArea] - The event is inside chartArea
	 * @returns {boolean} true if the tooltip changed
	 */
  handleEvent(e, replay, inChartArea = true) {
    if (replay && this._ignoreReplayEvents) {
      return false;
    }
    this._ignoreReplayEvents = false;

    const options = this.options;
    const lastActive = this._active || [];
    const active = this._getActiveElements(e, lastActive, replay, inChartArea);

    // When there are multiple items shown, but the tooltip position is nearest mode
    // an update may need to be made because our position may have changed even though
    // the items are the same as before.
    const positionChanged = this._positionChanged(active, e);

    // Remember Last Actives
    const changed = replay || !_elementsEqual(active, lastActive) || positionChanged;

    // Only handle target event on tooltip change
    if (changed) {
      this._active = active;

      if (options.enabled || options.external) {
        this._eventPosition = {
          x: e.x,
          y: e.y
        };

        this.update(true, replay);
      }
    }

    return changed;
  }

  /**
	 * Helper for determining the active elements for event
	 * @param {ChartEvent} e - The event to handle
	 * @param {InteractionItem[]} lastActive - Previously active elements
	 * @param {boolean} [replay] - This is a replayed event (from update)
	 * @param {boolean} [inChartArea] - The event is inside chartArea
	 * @returns {InteractionItem[]} - Active elements
	 * @private
	 */
  _getActiveElements(e, lastActive, replay, inChartArea) {
    const options = this.options;

    if (e.type === 'mouseout') {
      return [];
    }

    if (!inChartArea) {
      // Let user control the active elements outside chartArea. Eg. using Legend.
      return lastActive;
    }

    // Find Active Elements for tooltips
    const active = this.chart.getElementsAtEventForMode(e, options.mode, options, replay);

    if (options.reverse) {
      active.reverse();
    }

    return active;
  }

  /**
	 * Determine if the active elements + event combination changes the
	 * tooltip position
	 * @param {array} active - Active elements
	 * @param {ChartEvent} e - Event that triggered the position change
	 * @returns {boolean} True if the position has changed
	 */
  _positionChanged(active, e) {
    const {caretX, caretY, options} = this;
    const position = positioners[options.position].call(this, active, e);
    return position !== false && (caretX !== position.x || caretY !== position.y);
  }
}
