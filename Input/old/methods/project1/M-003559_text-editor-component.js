renderLineTiles() {
  const style = {
    position: 'absolute',
    contain: 'strict',
    overflow: 'hidden'
  };

  const children = [];
  children.push(this.renderHighlightDecorations());

  if (this.hasInitialMeasurements) {
    const { lineComponentsByScreenLineId } = this;

    const startRow = this.getRenderedStartRow();
    const endRow = this.getRenderedEndRow();
    const rowsPerTile = this.getRowsPerTile();
    const tileWidth = this.getScrollWidth();

    for (let i = 0; i < this.renderedTileStartRows.length; i++) {
      const tileStartRow = this.renderedTileStartRows[i];
      const tileEndRow = Math.min(endRow, tileStartRow + rowsPerTile);
      const tileHeight =
        this.pixelPositionBeforeBlocksForRow(tileEndRow) -
        this.pixelPositionBeforeBlocksForRow(tileStartRow);

      children.push(
        $(LinesTileComponent, {
          key: this.idsByTileStartRow.get(tileStartRow),
          measuredContent: this.measuredContent,
          height: tileHeight,
          width: tileWidth,
          top: this.pixelPositionBeforeBlocksForRow(tileStartRow),
          lineHeight: this.getLineHeight(),
          renderedStartRow: startRow,
          tileStartRow,
          tileEndRow,
          screenLines: this.renderedScreenLines.slice(
            tileStartRow - startRow,
            tileEndRow - startRow
          ),
          lineDecorations: this.decorationsToRender.lines.slice(
            tileStartRow - startRow,
            tileEndRow - startRow
          ),
          textDecorations: this.decorationsToRender.text.slice(
            tileStartRow - startRow,
            tileEndRow - startRow
          ),
          blockDecorations: this.decorationsToRender.blocks.get(tileStartRow),
          displayLayer: this.props.model.displayLayer,
          nodePool: this.lineNodesPool,
          lineComponentsByScreenLineId
        })
      );
    }

    this.extraRenderedScreenLines.forEach((screenLine, screenRow) => {
      if (screenRow < startRow || screenRow >= endRow) {
        children.push(
          $(LineComponent, {
            key: 'extra-' + screenLine.id,
            offScreen: true,
            screenLine,
            screenRow,
            displayLayer: this.props.model.displayLayer,
            nodePool: this.lineNodesPool,
            lineComponentsByScreenLineId
          })
        );
      }
    });

    style.width = this.getScrollWidth() + 'px';
    style.height = this.getScrollHeight() + 'px';
  }

  children.push(this.renderPlaceholderText());
  children.push(this.renderCursorsAndInput());

  return $.div(
    { key: 'lineTiles', ref: 'lineTiles', className: 'lines', style },
    children
  );
}
