lineTextForScreenRow(screenRow) {
  const screenLine = this.screenLineForScreenRow(screenRow);
  if (screenLine) return screenLine.lineText;
}
