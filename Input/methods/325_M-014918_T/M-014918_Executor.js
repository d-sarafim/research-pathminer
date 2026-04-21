createLabel(text, textKey, fillKey, strokeKey) {
  const key = text + textKey + fillKey + strokeKey;
  if (this.labels_[key]) {
    return this.labels_[key];
  }
  const strokeState = strokeKey ? this.strokeStates[strokeKey] : null;
  const fillState = fillKey ? this.fillStates[fillKey] : null;
  const textState = this.textStates[textKey];
  const pixelRatio = this.pixelRatio;
  const scale = [
    textState.scale[0] * pixelRatio,
    textState.scale[1] * pixelRatio,
  ];
  const textIsArray = Array.isArray(text);
  const align = textState.justify
    ? TEXT_ALIGN[textState.justify]
    : horizontalTextAlign(
        Array.isArray(text) ? text[0] : text,
        textState.textAlign || defaultTextAlign
      );
  const strokeWidth =
    strokeKey && strokeState.lineWidth ? strokeState.lineWidth : 0;

  const chunks = textIsArray
    ? text
    : text.split('\n').reduce(createTextChunks, []);

  const {width, height, widths, heights, lineWidths} = getTextDimensions(
    textState,
    chunks
  );
  const renderWidth = width + strokeWidth;
  const contextInstructions = [];
  // make canvas 2 pixels wider to account for italic text width measurement errors
  const w = (renderWidth + 2) * scale[0];
  const h = (height + strokeWidth) * scale[1];
  /** @type {import("../canvas.js").Label} */
  const label = {
    width: w < 0 ? Math.floor(w) : Math.ceil(w),
    height: h < 0 ? Math.floor(h) : Math.ceil(h),
    contextInstructions: contextInstructions,
  };
  if (scale[0] != 1 || scale[1] != 1) {
    contextInstructions.push('scale', scale);
  }
  if (strokeKey) {
    contextInstructions.push('strokeStyle', strokeState.strokeStyle);
    contextInstructions.push('lineWidth', strokeWidth);
    contextInstructions.push('lineCap', strokeState.lineCap);
    contextInstructions.push('lineJoin', strokeState.lineJoin);
    contextInstructions.push('miterLimit', strokeState.miterLimit);
    contextInstructions.push('setLineDash', [strokeState.lineDash]);
    contextInstructions.push('lineDashOffset', strokeState.lineDashOffset);
  }
  if (fillKey) {
    contextInstructions.push('fillStyle', fillState.fillStyle);
  }
  contextInstructions.push('textBaseline', 'middle');
  contextInstructions.push('textAlign', 'center');
  const leftRight = 0.5 - align;
  let x = align * renderWidth + leftRight * strokeWidth;
  const strokeInstructions = [];
  const fillInstructions = [];
  let lineHeight = 0;
  let lineOffset = 0;
  let widthHeightIndex = 0;
  let lineWidthIndex = 0;
  let previousFont;
  for (let i = 0, ii = chunks.length; i < ii; i += 2) {
    const text = chunks[i];
    if (text === '\n') {
      lineOffset += lineHeight;
      lineHeight = 0;
      x = align * renderWidth + leftRight * strokeWidth;
      ++lineWidthIndex;
      continue;
    }
    const font = chunks[i + 1] || textState.font;
    if (font !== previousFont) {
      if (strokeKey) {
        strokeInstructions.push('font', font);
      }
      if (fillKey) {
        fillInstructions.push('font', font);
      }
      previousFont = font;
    }
    lineHeight = Math.max(lineHeight, heights[widthHeightIndex]);
    const fillStrokeArgs = [
      text,
      x +
        leftRight * widths[widthHeightIndex] +
        align * (widths[widthHeightIndex] - lineWidths[lineWidthIndex]),
      0.5 * (strokeWidth + lineHeight) + lineOffset,
    ];
    x += widths[widthHeightIndex];
    if (strokeKey) {
      strokeInstructions.push('strokeText', fillStrokeArgs);
    }
    if (fillKey) {
      fillInstructions.push('fillText', fillStrokeArgs);
    }
    ++widthHeightIndex;
  }
  Array.prototype.push.apply(contextInstructions, strokeInstructions);
  Array.prototype.push.apply(contextInstructions, fillInstructions);
  this.labels_[key] = label;
  return label;
}
