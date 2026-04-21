setScreenRange(screenRange, options) {
  return this.setBufferRange(
    this.editor.bufferRangeForScreenRange(screenRange),
    options
  );
}
