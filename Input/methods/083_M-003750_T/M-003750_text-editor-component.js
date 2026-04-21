updateLines(oldProps, newProps) {
  const {
    screenLines,
    tileStartRow,
    lineDecorations,
    textDecorations,
    nodePool,
    displayLayer,
    lineComponentsByScreenLineId
  } = newProps;

  const oldScreenLines = oldProps.screenLines;
  const newScreenLines = screenLines;
  const oldScreenLinesEndIndex = oldScreenLines.length;
  const newScreenLinesEndIndex = newScreenLines.length;
  let oldScreenLineIndex = 0;
  let newScreenLineIndex = 0;
  let lineComponentIndex = 0;

  while (
    oldScreenLineIndex < oldScreenLinesEndIndex ||
    newScreenLineIndex < newScreenLinesEndIndex
  ) {
    const oldScreenLine = oldScreenLines[oldScreenLineIndex];
    const newScreenLine = newScreenLines[newScreenLineIndex];

    if (oldScreenLineIndex >= oldScreenLinesEndIndex) {
      var newScreenLineComponent = new LineComponent({
        screenLine: newScreenLine,
        screenRow: tileStartRow + newScreenLineIndex,
        lineDecoration: lineDecorations[newScreenLineIndex],
        textDecorations: textDecorations[newScreenLineIndex],
        displayLayer,
        nodePool,
        lineComponentsByScreenLineId
      });
      this.element.appendChild(newScreenLineComponent.element);
      this.lineComponents.push(newScreenLineComponent);

      newScreenLineIndex++;
      lineComponentIndex++;
    } else if (newScreenLineIndex >= newScreenLinesEndIndex) {
      this.lineComponents[lineComponentIndex].destroy();
      this.lineComponents.splice(lineComponentIndex, 1);

      oldScreenLineIndex++;
    } else if (oldScreenLine === newScreenLine) {
      const lineComponent = this.lineComponents[lineComponentIndex];
      lineComponent.update({
        screenRow: tileStartRow + newScreenLineIndex,
        lineDecoration: lineDecorations[newScreenLineIndex],
        textDecorations: textDecorations[newScreenLineIndex]
      });

      oldScreenLineIndex++;
      newScreenLineIndex++;
      lineComponentIndex++;
    } else {
      const oldScreenLineIndexInNewScreenLines = newScreenLines.indexOf(
        oldScreenLine
      );
      const newScreenLineIndexInOldScreenLines = oldScreenLines.indexOf(
        newScreenLine
      );
      if (
        newScreenLineIndex < oldScreenLineIndexInNewScreenLines &&
        oldScreenLineIndexInNewScreenLines < newScreenLinesEndIndex
      ) {
        const newScreenLineComponents = [];
        while (newScreenLineIndex < oldScreenLineIndexInNewScreenLines) {
          // eslint-disable-next-line no-redeclare
          var newScreenLineComponent = new LineComponent({
            screenLine: newScreenLines[newScreenLineIndex],
            screenRow: tileStartRow + newScreenLineIndex,
            lineDecoration: lineDecorations[newScreenLineIndex],
            textDecorations: textDecorations[newScreenLineIndex],
            displayLayer,
            nodePool,
            lineComponentsByScreenLineId
          });
          this.element.insertBefore(
            newScreenLineComponent.element,
            this.getFirstElementForScreenLine(oldProps, oldScreenLine)
          );
          newScreenLineComponents.push(newScreenLineComponent);

          newScreenLineIndex++;
        }

        this.lineComponents.splice(
          lineComponentIndex,
          0,
          ...newScreenLineComponents
        );
        lineComponentIndex =
          lineComponentIndex + newScreenLineComponents.length;
      } else if (
        oldScreenLineIndex < newScreenLineIndexInOldScreenLines &&
        newScreenLineIndexInOldScreenLines < oldScreenLinesEndIndex
      ) {
        while (oldScreenLineIndex < newScreenLineIndexInOldScreenLines) {
          this.lineComponents[lineComponentIndex].destroy();
          this.lineComponents.splice(lineComponentIndex, 1);

          oldScreenLineIndex++;
        }
      } else {
        const oldScreenLineComponent = this.lineComponents[
          lineComponentIndex
        ];
        // eslint-disable-next-line no-redeclare
        var newScreenLineComponent = new LineComponent({
          screenLine: newScreenLines[newScreenLineIndex],
          screenRow: tileStartRow + newScreenLineIndex,
          lineDecoration: lineDecorations[newScreenLineIndex],
          textDecorations: textDecorations[newScreenLineIndex],
          displayLayer,
          nodePool,
          lineComponentsByScreenLineId
        });
        this.element.insertBefore(
          newScreenLineComponent.element,
          oldScreenLineComponent.element
        );
        oldScreenLineComponent.destroy();
        this.lineComponents[lineComponentIndex] = newScreenLineComponent;

        oldScreenLineIndex++;
        newScreenLineIndex++;
        lineComponentIndex++;
      }
    }
  }
}
