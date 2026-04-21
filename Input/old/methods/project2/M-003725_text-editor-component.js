render() {
  const {
    rootComponent,
    showLineNumbers,
    height,
    width,
    startRow,
    endRow,
    rowsPerTile,
    maxDigits,
    keys,
    bufferRows,
    screenRows,
    softWrappedFlags,
    foldableFlags,
    decorations,
    className
  } = this.props;

  let children = null;

  if (bufferRows) {
    children = new Array(rootComponent.renderedTileStartRows.length);
    for (let i = 0; i < rootComponent.renderedTileStartRows.length; i++) {
      const tileStartRow = rootComponent.renderedTileStartRows[i];
      const tileEndRow = Math.min(endRow, tileStartRow + rowsPerTile);
      const tileChildren = new Array(tileEndRow - tileStartRow);
      for (let row = tileStartRow; row < tileEndRow; row++) {
        const indexInTile = row - tileStartRow;
        const j = row - startRow;
        const key = keys[j];
        const softWrapped = softWrappedFlags[j];
        const foldable = foldableFlags[j];
        const bufferRow = bufferRows[j];
        const screenRow = screenRows[j];

        let className = 'line-number';
        if (foldable) className = className + ' foldable';

        const decorationsForRow = decorations[row - startRow];
        if (decorationsForRow)
          className = className + ' ' + decorationsForRow;

        let number = null;
        if (showLineNumbers) {
          if (this.props.labelFn == null) {
            number = softWrapped ? '•' : bufferRow + 1;
            number =
              NBSP_CHARACTER.repeat(maxDigits - number.length) + number;
          } else {
            number = this.props.labelFn({
              bufferRow,
              screenRow,
              foldable,
              softWrapped,
              maxDigits
            });
          }
        }

        // We need to adjust the line number position to account for block
        // decorations preceding the current row and following the preceding
        // row. Note that we ignore the latter when the line number starts at
        // the beginning of the tile, because the tile will already be
        // positioned to take into account block decorations added after the
        // last row of the previous tile.
        let marginTop = rootComponent.heightForBlockDecorationsBeforeRow(row);
        if (indexInTile > 0)
          marginTop += rootComponent.heightForBlockDecorationsAfterRow(
            row - 1
          );

        tileChildren[row - tileStartRow] = $(LineNumberComponent, {
          key,
          className,
          width,
          bufferRow,
          screenRow,
          number,
          marginTop,
          nodePool: this.nodePool
        });
      }

      const tileTop = rootComponent.pixelPositionBeforeBlocksForRow(
        tileStartRow
      );
      const tileBottom = rootComponent.pixelPositionBeforeBlocksForRow(
        tileEndRow
      );
      const tileHeight = tileBottom - tileTop;
      const tileWidth = width != null && width > 0 ? width + 'px' : '';

      children[i] = $.div(
        {
          key: rootComponent.idsByTileStartRow.get(tileStartRow),
          style: {
            contain: 'layout style',
            position: 'absolute',
            top: 0,
            height: tileHeight + 'px',
            width: tileWidth,
            transform: `translateY(${tileTop}px)`
          }
        },
        ...tileChildren
      );
    }
  }

  let rootClassName = 'gutter line-numbers';
  if (className) {
    rootClassName += ' ' + className;
  }

  return $.div(
    {
      className: rootClassName,
      attributes: { 'gutter-name': this.props.name },
      style: {
        position: 'relative',
        height: ceilToPhysicalPixelBoundary(height) + 'px'
      },
      on: {
        mousedown: this.didMouseDown,
        mousemove: this.didMouseMove
      }
    },
    $.div(
      {
        key: 'placeholder',
        className: 'line-number dummy',
        style: { visibility: 'hidden' }
      },
      showLineNumbers ? '0'.repeat(maxDigits) : null,
      $.div({ className: 'icon-right' })
    ),
    children
  );
}
