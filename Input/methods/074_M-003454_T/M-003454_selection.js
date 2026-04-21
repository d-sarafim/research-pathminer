insertText(text, options = {}) {
  if (!this.ensureWritable('insertText', options)) return;

  let desiredIndentLevel, indentAdjustment;
  const oldBufferRange = this.getBufferRange();
  const wasReversed = this.isReversed();
  this.clear(options);

  let autoIndentFirstLine = false;
  const precedingText = this.editor.getTextInRange([
    [oldBufferRange.start.row, 0],
    oldBufferRange.start
  ]);
  const remainingLines = text.split('\n');
  const firstInsertedLine = remainingLines.shift();

  if (
    options.indentBasis != null &&
    !options.preserveTrailingLineIndentation
  ) {
    indentAdjustment =
      this.editor.indentLevelForLine(precedingText) - options.indentBasis;
    this.adjustIndent(remainingLines, indentAdjustment);
  }

  const textIsAutoIndentable =
    text === '\n' || text === '\r\n' || NonWhitespaceRegExp.test(text);
  if (
    options.autoIndent &&
    textIsAutoIndentable &&
    !NonWhitespaceRegExp.test(precedingText) &&
    remainingLines.length > 0
  ) {
    autoIndentFirstLine = true;
    const firstLine = precedingText + firstInsertedLine;
    const languageMode = this.editor.buffer.getLanguageMode();
    desiredIndentLevel =
      languageMode.suggestedIndentForLineAtBufferRow &&
      languageMode.suggestedIndentForLineAtBufferRow(
        oldBufferRange.start.row,
        firstLine,
        this.editor.getTabLength()
      );
    if (desiredIndentLevel != null) {
      indentAdjustment =
        desiredIndentLevel - this.editor.indentLevelForLine(firstLine);
      this.adjustIndent(remainingLines, indentAdjustment);
    }
  }

  text = firstInsertedLine;
  if (remainingLines.length > 0) text += `\n${remainingLines.join('\n')}`;

  const newBufferRange = this.editor.buffer.setTextInRange(
    oldBufferRange,
    text,
    pick(options, 'undo', 'normalizeLineEndings')
  );

  if (options.select) {
    this.setBufferRange(newBufferRange, { reversed: wasReversed });
  } else {
    if (wasReversed) this.cursor.setBufferPosition(newBufferRange.end);
  }

  if (autoIndentFirstLine) {
    this.editor.setIndentationForBufferRow(
      oldBufferRange.start.row,
      desiredIndentLevel
    );
  }

  if (options.autoIndentNewline && text === '\n') {
    this.editor.autoIndentBufferRow(newBufferRange.end.row, {
      preserveLeadingWhitespace: true,
      skipBlankLines: false
    });
  } else if (options.autoDecreaseIndent && NonWhitespaceRegExp.test(text)) {
    this.editor.autoDecreaseIndentForBufferRow(newBufferRange.start.row);
  }

  const autoscroll =
    options.autoscroll != null ? options.autoscroll : this.isLastSelection();
  if (autoscroll) this.autoscroll();

  return newBufferRange;
}
