execute_(
  context,
  contextScale,
  transform,
  instructions,
  snapToPixel,
  featureCallback,
  hitExtent,
  declutterTree
) {
  /** @type {Array<number>} */
  let pixelCoordinates;
  if (this.pixelCoordinates_ && equals(transform, this.renderedTransform_)) {
    pixelCoordinates = this.pixelCoordinates_;
  } else {
    if (!this.pixelCoordinates_) {
      this.pixelCoordinates_ = [];
    }
    pixelCoordinates = transform2D(
      this.coordinates,
      0,
      this.coordinates.length,
      2,
      transform,
      this.pixelCoordinates_
    );
    transformSetFromArray(this.renderedTransform_, transform);
  }
  let i = 0; // instruction index
  const ii = instructions.length; // end of instructions
  let d = 0; // data index
  let dd; // end of per-instruction data
  let anchorX,
    anchorY,
    prevX,
    prevY,
    roundX,
    roundY,
    image,
    text,
    textKey,
    strokeKey,
    fillKey;
  let pendingFill = 0;
  let pendingStroke = 0;
  let lastFillInstruction = null;
  let lastStrokeInstruction = null;
  const coordinateCache = this.coordinateCache_;
  const viewRotation = this.viewRotation_;
  const viewRotationFromTransform =
    Math.round(Math.atan2(-transform[1], transform[0]) * 1e12) / 1e12;

  const state = /** @type {import("../../render.js").State} */ ({
    context: context,
    pixelRatio: this.pixelRatio,
    resolution: this.resolution,
    rotation: viewRotation,
  });

  // When the batch size gets too big, performance decreases. 200 is a good
  // balance between batch size and number of fill/stroke instructions.
  const batchSize =
    this.instructions != instructions || this.overlaps ? 0 : 200;
  let /** @type {import("../../Feature.js").FeatureLike} */ feature;
  let x, y, currentGeometry;
  while (i < ii) {
    const instruction = instructions[i];
    const type = /** @type {import("./Instruction.js").default} */ (
      instruction[0]
    );
    switch (type) {
      case CanvasInstruction.BEGIN_GEOMETRY:
        feature = /** @type {import("../../Feature.js").FeatureLike} */ (
          instruction[1]
        );
        currentGeometry = instruction[3];
        if (!feature.getGeometry()) {
          i = /** @type {number} */ (instruction[2]);
        } else if (
          hitExtent !== undefined &&
          !intersects(hitExtent, currentGeometry.getExtent())
        ) {
          i = /** @type {number} */ (instruction[2]) + 1;
        } else {
          ++i;
        }
        break;
      case CanvasInstruction.BEGIN_PATH:
        if (pendingFill > batchSize) {
          this.fill_(context);
          pendingFill = 0;
        }
        if (pendingStroke > batchSize) {
          context.stroke();
          pendingStroke = 0;
        }
        if (!pendingFill && !pendingStroke) {
          context.beginPath();
          prevX = NaN;
          prevY = NaN;
        }
        ++i;
        break;
      case CanvasInstruction.CIRCLE:
        d = /** @type {number} */ (instruction[1]);
        const x1 = pixelCoordinates[d];
        const y1 = pixelCoordinates[d + 1];
        const x2 = pixelCoordinates[d + 2];
        const y2 = pixelCoordinates[d + 3];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const r = Math.sqrt(dx * dx + dy * dy);
        context.moveTo(x1 + r, y1);
        context.arc(x1, y1, r, 0, 2 * Math.PI, true);
        ++i;
        break;
      case CanvasInstruction.CLOSE_PATH:
        context.closePath();
        ++i;
        break;
      case CanvasInstruction.CUSTOM:
        d = /** @type {number} */ (instruction[1]);
        dd = instruction[2];
        const geometry =
          /** @type {import("../../geom/SimpleGeometry.js").default} */ (
            instruction[3]
          );
        const renderer = instruction[4];
        const fn = instruction.length == 6 ? instruction[5] : undefined;
        state.geometry = geometry;
        state.feature = feature;
        if (!(i in coordinateCache)) {
          coordinateCache[i] = [];
        }
        const coords = coordinateCache[i];
        if (fn) {
          fn(pixelCoordinates, d, dd, 2, coords);
        } else {
          coords[0] = pixelCoordinates[d];
          coords[1] = pixelCoordinates[d + 1];
          coords.length = 2;
        }
        renderer(coords, state);
        ++i;
        break;
      case CanvasInstruction.DRAW_IMAGE:
        d = /** @type {number} */ (instruction[1]);
        dd = /** @type {number} */ (instruction[2]);
        image =
          /** @type {HTMLCanvasElement|HTMLVideoElement|HTMLImageElement} */ (
            instruction[3]
          );

        // Remaining arguments in DRAW_IMAGE are in alphabetical order
        anchorX = /** @type {number} */ (instruction[4]);
        anchorY = /** @type {number} */ (instruction[5]);
        let height = /** @type {number} */ (instruction[6]);
        const opacity = /** @type {number} */ (instruction[7]);
        const originX = /** @type {number} */ (instruction[8]);
        const originY = /** @type {number} */ (instruction[9]);
        const rotateWithView = /** @type {boolean} */ (instruction[10]);
        let rotation = /** @type {number} */ (instruction[11]);
        const scale = /** @type {import("../../size.js").Size} */ (
          instruction[12]
        );
        let width = /** @type {number} */ (instruction[13]);
        const declutterMode =
          /** @type {"declutter"|"obstacle"|"none"|undefined} */ (
            instruction[14]
          );
        const declutterImageWithText =
          /** @type {import("../canvas.js").DeclutterImageWithText} */ (
            instruction[15]
          );

        if (!image && instruction.length >= 20) {
          // create label images
          text = /** @type {string} */ (instruction[19]);
          textKey = /** @type {string} */ (instruction[20]);
          strokeKey = /** @type {string} */ (instruction[21]);
          fillKey = /** @type {string} */ (instruction[22]);
          const labelWithAnchor = this.drawLabelWithPointPlacement_(
            text,
            textKey,
            strokeKey,
            fillKey
          );
          image = labelWithAnchor.label;
          instruction[3] = image;
          const textOffsetX = /** @type {number} */ (instruction[23]);
          anchorX = (labelWithAnchor.anchorX - textOffsetX) * this.pixelRatio;
          instruction[4] = anchorX;
          const textOffsetY = /** @type {number} */ (instruction[24]);
          anchorY = (labelWithAnchor.anchorY - textOffsetY) * this.pixelRatio;
          instruction[5] = anchorY;
          height = image.height;
          instruction[6] = height;
          width = image.width;
          instruction[13] = width;
        }

        let geometryWidths;
        if (instruction.length > 25) {
          geometryWidths = /** @type {number} */ (instruction[25]);
        }

        let padding, backgroundFill, backgroundStroke;
        if (instruction.length > 17) {
          padding = /** @type {Array<number>} */ (instruction[16]);
          backgroundFill = /** @type {boolean} */ (instruction[17]);
          backgroundStroke = /** @type {boolean} */ (instruction[18]);
        } else {
          padding = defaultPadding;
          backgroundFill = false;
          backgroundStroke = false;
        }

        if (rotateWithView && viewRotationFromTransform) {
          // Canvas is expected to be rotated to reverse view rotation.
          rotation += viewRotation;
        } else if (!rotateWithView && !viewRotationFromTransform) {
          // Canvas is not rotated, images need to be rotated back to be north-up.
          rotation -= viewRotation;
        }
        let widthIndex = 0;
        for (; d < dd; d += 2) {
          if (
            geometryWidths &&
            geometryWidths[widthIndex++] < width / this.pixelRatio
          ) {
            continue;
          }
          const dimensions = this.calculateImageOrLabelDimensions_(
            image.width,
            image.height,
            pixelCoordinates[d],
            pixelCoordinates[d + 1],
            width,
            height,
            anchorX,
            anchorY,
            originX,
            originY,
            rotation,
            scale,
            snapToPixel,
            padding,
            backgroundFill || backgroundStroke,
            feature
          );
          /** @type {ReplayImageOrLabelArgs} */
          const args = [
            context,
            contextScale,
            image,
            dimensions,
            opacity,
            backgroundFill
              ? /** @type {Array<*>} */ (lastFillInstruction)
              : null,
            backgroundStroke
              ? /** @type {Array<*>} */ (lastStrokeInstruction)
              : null,
          ];
          if (declutterTree) {
            if (declutterMode === 'none') {
              // not rendered in declutter group
              continue;
            } else if (declutterMode === 'obstacle') {
              // will always be drawn, thus no collision detection, but insert as obstacle
              declutterTree.insert(dimensions.declutterBox);
              continue;
            } else {
              let imageArgs;
              let imageDeclutterBox;
              if (declutterImageWithText) {
                const index = dd - d;
                if (!declutterImageWithText[index]) {
                  // We now have the image for an image+text combination.
                  declutterImageWithText[index] = args;
                  // Don't render anything for now, wait for the text.
                  continue;
                }
                imageArgs = declutterImageWithText[index];
                delete declutterImageWithText[index];
                imageDeclutterBox = getDeclutterBox(imageArgs);
                if (declutterTree.collides(imageDeclutterBox)) {
                  continue;
                }
              }
              if (declutterTree.collides(dimensions.declutterBox)) {
                continue;
              }
              if (imageArgs) {
                // We now have image and text for an image+text combination.
                declutterTree.insert(imageDeclutterBox);
                // Render the image before we render the text.
                this.replayImageOrLabel_.apply(this, imageArgs);
              }
              declutterTree.insert(dimensions.declutterBox);
            }
          }
          this.replayImageOrLabel_.apply(this, args);
        }
        ++i;
        break;
      case CanvasInstruction.DRAW_CHARS:
        const begin = /** @type {number} */ (instruction[1]);
        const end = /** @type {number} */ (instruction[2]);
        const baseline = /** @type {number} */ (instruction[3]);
        const overflow = /** @type {number} */ (instruction[4]);
        fillKey = /** @type {string} */ (instruction[5]);
        const maxAngle = /** @type {number} */ (instruction[6]);
        const measurePixelRatio = /** @type {number} */ (instruction[7]);
        const offsetY = /** @type {number} */ (instruction[8]);
        strokeKey = /** @type {string} */ (instruction[9]);
        const strokeWidth = /** @type {number} */ (instruction[10]);
        text = /** @type {string} */ (instruction[11]);
        textKey = /** @type {string} */ (instruction[12]);
        const pixelRatioScale = [
          /** @type {number} */ (instruction[13]),
          /** @type {number} */ (instruction[13]),
        ];

        const textState = this.textStates[textKey];
        const font = textState.font;
        const textScale = [
          textState.scale[0] * measurePixelRatio,
          textState.scale[1] * measurePixelRatio,
        ];

        let cachedWidths;
        if (font in this.widths_) {
          cachedWidths = this.widths_[font];
        } else {
          cachedWidths = {};
          this.widths_[font] = cachedWidths;
        }

        const pathLength = lineStringLength(pixelCoordinates, begin, end, 2);
        const textLength =
          Math.abs(textScale[0]) *
          measureAndCacheTextWidth(font, text, cachedWidths);
        if (overflow || textLength <= pathLength) {
          const textAlign = this.textStates[textKey].textAlign;
          const startM =
            (pathLength - textLength) * horizontalTextAlign(text, textAlign);
          const parts = drawTextOnPath(
            pixelCoordinates,
            begin,
            end,
            2,
            text,
            startM,
            maxAngle,
            Math.abs(textScale[0]),
            measureAndCacheTextWidth,
            font,
            cachedWidths,
            viewRotationFromTransform ? 0 : this.viewRotation_
          );
          drawChars: if (parts) {
            /** @type {Array<ReplayImageOrLabelArgs>} */
            const replayImageOrLabelArgs = [];
            let c, cc, chars, label, part;
            if (strokeKey) {
              for (c = 0, cc = parts.length; c < cc; ++c) {
                part = parts[c]; // x, y, anchorX, rotation, chunk
                chars = /** @type {string} */ (part[4]);
                label = this.createLabel(chars, textKey, '', strokeKey);
                anchorX =
                  /** @type {number} */ (part[2]) +
                  (textScale[0] < 0 ? -strokeWidth : strokeWidth);
                anchorY =
                  baseline * label.height +
                  ((0.5 - baseline) * 2 * strokeWidth * textScale[1]) /
                    textScale[0] -
                  offsetY;
                const dimensions = this.calculateImageOrLabelDimensions_(
                  label.width,
                  label.height,
                  part[0],
                  part[1],
                  label.width,
                  label.height,
                  anchorX,
                  anchorY,
                  0,
                  0,
                  part[3],
                  pixelRatioScale,
                  false,
                  defaultPadding,
                  false,
                  feature
                );
                if (
                  declutterTree &&
                  declutterTree.collides(dimensions.declutterBox)
                ) {
                  break drawChars;
                }
                replayImageOrLabelArgs.push([
                  context,
                  contextScale,
                  label,
                  dimensions,
                  1,
                  null,
                  null,
                ]);
              }
            }
            if (fillKey) {
              for (c = 0, cc = parts.length; c < cc; ++c) {
                part = parts[c]; // x, y, anchorX, rotation, chunk
                chars = /** @type {string} */ (part[4]);
                label = this.createLabel(chars, textKey, fillKey, '');
                anchorX = /** @type {number} */ (part[2]);
                anchorY = baseline * label.height - offsetY;
                const dimensions = this.calculateImageOrLabelDimensions_(
                  label.width,
                  label.height,
                  part[0],
                  part[1],
                  label.width,
                  label.height,
                  anchorX,
                  anchorY,
                  0,
                  0,
                  part[3],
                  pixelRatioScale,
                  false,
                  defaultPadding,
                  false,
                  feature
                );
                if (
                  declutterTree &&
                  declutterTree.collides(dimensions.declutterBox)
                ) {
                  break drawChars;
                }
                replayImageOrLabelArgs.push([
                  context,
                  contextScale,
                  label,
                  dimensions,
                  1,
                  null,
                  null,
                ]);
              }
            }
            if (declutterTree) {
              declutterTree.load(replayImageOrLabelArgs.map(getDeclutterBox));
            }
            for (let i = 0, ii = replayImageOrLabelArgs.length; i < ii; ++i) {
              this.replayImageOrLabel_.apply(this, replayImageOrLabelArgs[i]);
            }
          }
        }
        ++i;
        break;
      case CanvasInstruction.END_GEOMETRY:
        if (featureCallback !== undefined) {
          feature = /** @type {import("../../Feature.js").FeatureLike} */ (
            instruction[1]
          );
          const result = featureCallback(feature, currentGeometry);
          if (result) {
            return result;
          }
        }
        ++i;
        break;
      case CanvasInstruction.FILL:
        if (batchSize) {
          pendingFill++;
        } else {
          this.fill_(context);
        }
        ++i;
        break;
      case CanvasInstruction.MOVE_TO_LINE_TO:
        d = /** @type {number} */ (instruction[1]);
        dd = /** @type {number} */ (instruction[2]);
        x = pixelCoordinates[d];
        y = pixelCoordinates[d + 1];
        roundX = (x + 0.5) | 0;
        roundY = (y + 0.5) | 0;
        if (roundX !== prevX || roundY !== prevY) {
          context.moveTo(x, y);
          prevX = roundX;
          prevY = roundY;
        }
        for (d += 2; d < dd; d += 2) {
          x = pixelCoordinates[d];
          y = pixelCoordinates[d + 1];
          roundX = (x + 0.5) | 0;
          roundY = (y + 0.5) | 0;
          if (d == dd - 2 || roundX !== prevX || roundY !== prevY) {
            context.lineTo(x, y);
            prevX = roundX;
            prevY = roundY;
          }
        }
        ++i;
        break;
      case CanvasInstruction.SET_FILL_STYLE:
        lastFillInstruction = instruction;
        this.alignFill_ = instruction[2];

        if (pendingFill) {
          this.fill_(context);
          pendingFill = 0;
          if (pendingStroke) {
            context.stroke();
            pendingStroke = 0;
          }
        }

        context.fillStyle =
          /** @type {import("../../colorlike.js").ColorLike} */ (
            instruction[1]
          );
        ++i;
        break;
      case CanvasInstruction.SET_STROKE_STYLE:
        lastStrokeInstruction = instruction;
        if (pendingStroke) {
          context.stroke();
          pendingStroke = 0;
        }
        this.setStrokeStyle_(context, /** @type {Array<*>} */ (instruction));
        ++i;
        break;
      case CanvasInstruction.STROKE:
        if (batchSize) {
          pendingStroke++;
        } else {
          context.stroke();
        }
        ++i;
        break;
      default: // consume the instruction anyway, to avoid an infinite loop
        ++i;
        break;
    }
  }
  if (pendingFill) {
    this.fill_(context);
  }
  if (pendingStroke) {
    context.stroke();
  }
  return undefined;
}
