moveToSuccessor() {
  this.openScopeIds = [];
  this.closeScopeIds = [];
  while (true) {
    if (this.tagIndex === this.currentLineTags.length) {
      if (this.isAtTagBoundary()) {
        break;
      } else if (!this.moveToNextLine()) {
        return false;
      }
    } else {
      const tag = this.currentLineTags[this.tagIndex];
      if (tag >= 0) {
        if (this.isAtTagBoundary()) {
          break;
        } else {
          this.position = Point(
            this.position.row,
            Math.min(
              this.currentLineLength,
              this.position.column + this.currentLineTags[this.tagIndex]
            )
          );
        }
      } else {
        const scopeId = fromFirstMateScopeId(tag);
        if ((tag & 1) === 0) {
          if (this.openScopeIds.length > 0) {
            break;
          } else {
            this.closeScopeIds.push(scopeId);
          }
        } else {
          this.openScopeIds.push(scopeId);
        }
      }
      this.tagIndex++;
    }
  }
  return true;
}
