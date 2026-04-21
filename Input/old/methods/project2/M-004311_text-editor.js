toggleLineCommentsForBufferRows(start, end, options = {}) {
  const languageMode = this.buffer.getLanguageMode();
  let { commentStartString, commentEndString } =
    (languageMode.commentStringsForPosition &&
      languageMode.commentStringsForPosition(new Point(start, 0))) ||
    {};
  if (!commentStartString) return;
  commentStartString = commentStartString.trim();

  if (commentEndString) {
    commentEndString = commentEndString.trim();
    const startDelimiterColumnRange = columnRangeForStartDelimiter(
      this.buffer.lineForRow(start),
      commentStartString
    );
    if (startDelimiterColumnRange) {
      const endDelimiterColumnRange = columnRangeForEndDelimiter(
        this.buffer.lineForRow(end),
        commentEndString
      );
      if (endDelimiterColumnRange) {
        this.buffer.transact(() => {
          this.buffer.delete([
            [end, endDelimiterColumnRange[0]],
            [end, endDelimiterColumnRange[1]]
          ]);
          this.buffer.delete([
            [start, startDelimiterColumnRange[0]],
            [start, startDelimiterColumnRange[1]]
          ]);
        });
      }
    } else {
      this.buffer.transact(() => {
        const indentLength = this.buffer.lineForRow(start).match(/^\s*/)[0]
          .length;
        this.buffer.insert([start, indentLength], commentStartString + ' ');
        this.buffer.insert(
          [end, this.buffer.lineLengthForRow(end)],
          ' ' + commentEndString
        );

        // Prevent the cursor from selecting / passing the delimiters
        // See https://github.com/atom/atom/pull/17519
        if (options.correctSelection && options.selection) {
          const endLineLength = this.buffer.lineLengthForRow(end);
          const oldRange = options.selection.getBufferRange();
          if (oldRange.isEmpty()) {
            if (oldRange.start.column === endLineLength) {
              const endCol = endLineLength - commentEndString.length - 1;
              options.selection.setBufferRange(
                [[end, endCol], [end, endCol]],
                { autoscroll: false }
              );
            }
          } else {
            const startDelta =
              oldRange.start.column === indentLength
                ? [0, commentStartString.length + 1]
                : [0, 0];
            const endDelta =
              oldRange.end.column === endLineLength
                ? [0, -commentEndString.length - 1]
                : [0, 0];
            options.selection.setBufferRange(
              oldRange.translate(startDelta, endDelta),
              { autoscroll: false }
            );
          }
        }
      });
    }
  } else {
    let hasCommentedLines = false;
    let hasUncommentedLines = false;
    for (let row = start; row <= end; row++) {
      const line = this.buffer.lineForRow(row);
      if (NON_WHITESPACE_REGEXP.test(line)) {
        if (columnRangeForStartDelimiter(line, commentStartString)) {
          hasCommentedLines = true;
        } else {
          hasUncommentedLines = true;
        }
      }
    }

    const shouldUncomment = hasCommentedLines && !hasUncommentedLines;

    if (shouldUncomment) {
      for (let row = start; row <= end; row++) {
        const columnRange = columnRangeForStartDelimiter(
          this.buffer.lineForRow(row),
          commentStartString
        );
        if (columnRange)
          this.buffer.delete([[row, columnRange[0]], [row, columnRange[1]]]);
      }
    } else {
      let minIndentLevel = Infinity;
      let minBlankIndentLevel = Infinity;
      for (let row = start; row <= end; row++) {
        const line = this.buffer.lineForRow(row);
        const indentLevel = this.indentLevelForLine(line);
        if (NON_WHITESPACE_REGEXP.test(line)) {
          if (indentLevel < minIndentLevel) minIndentLevel = indentLevel;
        } else {
          if (indentLevel < minBlankIndentLevel)
            minBlankIndentLevel = indentLevel;
        }
      }
      minIndentLevel = Number.isFinite(minIndentLevel)
        ? minIndentLevel
        : Number.isFinite(minBlankIndentLevel)
        ? minBlankIndentLevel
        : 0;

      const indentString = this.buildIndentString(minIndentLevel);
      for (let row = start; row <= end; row++) {
        const line = this.buffer.lineForRow(row);
        if (NON_WHITESPACE_REGEXP.test(line)) {
          const indentColumn = columnForIndentLevel(
            line,
            minIndentLevel,
            this.getTabLength()
          );
          this.buffer.insert(
            Point(row, indentColumn),
            commentStartString + ' '
          );
        } else {
          this.buffer.setTextInRange(
            new Range(new Point(row, 0), new Point(row, Infinity)),
            indentString + commentStartString + ' '
          );
        }
      }
    }
  }
}
