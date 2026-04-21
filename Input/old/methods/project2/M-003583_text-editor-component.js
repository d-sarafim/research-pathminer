populateTextDecorationsToRender() {
  // Sort all boundaries in ascending order of position
  this.textDecorationBoundaries.sort((a, b) =>
    a.position.compare(b.position)
  );

  // Combine adjacent boundaries with the same position
  for (let i = 0; i < this.textDecorationBoundaries.length; ) {
    const boundary = this.textDecorationBoundaries[i];
    const nextBoundary = this.textDecorationBoundaries[i + 1];
    if (nextBoundary && nextBoundary.position.isEqual(boundary.position)) {
      if (nextBoundary.starting) {
        if (boundary.starting) {
          boundary.starting.push(...nextBoundary.starting);
        } else {
          boundary.starting = nextBoundary.starting;
        }
      }

      if (nextBoundary.ending) {
        if (boundary.ending) {
          boundary.ending.push(...nextBoundary.ending);
        } else {
          boundary.ending = nextBoundary.ending;
        }
      }

      this.textDecorationBoundaries.splice(i + 1, 1);
    } else {
      i++;
    }
  }

  const renderedStartRow = this.getRenderedStartRow();
  const renderedEndRow = this.getRenderedEndRow();
  const containingMarkers = [];

  // Iterate over boundaries to build up text decorations.
  for (let i = 0; i < this.textDecorationBoundaries.length; i++) {
    const boundary = this.textDecorationBoundaries[i];

    // If multiple markers start here, sort them by order of nesting (markers ending later come first)
    if (boundary.starting && boundary.starting.length > 1) {
      boundary.starting.sort((a, b) => a.compare(b));
    }

    // If multiple markers start here, sort them by order of nesting (markers starting earlier come first)
    if (boundary.ending && boundary.ending.length > 1) {
      boundary.ending.sort((a, b) => b.compare(a));
    }

    // Remove markers ending here from containing markers array
    if (boundary.ending) {
      for (let j = boundary.ending.length - 1; j >= 0; j--) {
        containingMarkers.splice(
          containingMarkers.lastIndexOf(boundary.ending[j]),
          1
        );
      }
    }
    // Add markers starting here to containing markers array
    if (boundary.starting) containingMarkers.push(...boundary.starting);

    // Determine desired className and style based on containing markers
    let className, style;
    for (let j = 0; j < containingMarkers.length; j++) {
      const marker = containingMarkers[j];
      const decorations = this.textDecorationsByMarker.get(marker);
      for (let k = 0; k < decorations.length; k++) {
        const decoration = decorations[k];
        if (decoration.class) {
          if (className) {
            className += ' ' + decoration.class;
          } else {
            className = decoration.class;
          }
        }
        if (decoration.style) {
          if (style) {
            Object.assign(style, decoration.style);
          } else {
            style = Object.assign({}, decoration.style);
          }
        }
      }
    }

    // Add decoration start with className/style for current position's column,
    // and also for the start of every row up until the next decoration boundary
    if (boundary.position.row >= renderedStartRow) {
      this.addTextDecorationStart(
        boundary.position.row,
        boundary.position.column,
        className,
        style
      );
    }
    const nextBoundary = this.textDecorationBoundaries[i + 1];
    if (nextBoundary) {
      let row = Math.max(boundary.position.row + 1, renderedStartRow);
      const endRow = Math.min(nextBoundary.position.row, renderedEndRow);
      for (; row < endRow; row++) {
        this.addTextDecorationStart(row, 0, className, style);
      }

      if (
        row === nextBoundary.position.row &&
        nextBoundary.position.column !== 0
      ) {
        this.addTextDecorationStart(row, 0, className, style);
      }
    }
  }
}
