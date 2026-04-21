parseMultiPolygonText_() {
  if (this.match(TokenType.LEFT_PAREN)) {
    const coordinates = this.parsePolygonTextList_();
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  }
  throw new Error(this.formatErrorMessage_());
}
