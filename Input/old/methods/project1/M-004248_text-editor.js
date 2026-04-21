getScrollPastEnd() {
  if (this.getAutoHeight()) {
    return false;
  } else {
    return this.scrollPastEnd;
  }
}
