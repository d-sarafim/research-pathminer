moveLeft(columnCount) {
  return this.moveCursors(cursor =>
    cursor.moveLeft(columnCount, { moveToEndOfSelection: true })
  );
}
