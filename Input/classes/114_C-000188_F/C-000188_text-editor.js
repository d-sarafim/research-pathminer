class ChangeEvent {
  constructor({ oldRange, newRange }) {
    this.oldRange = oldRange;
    this.newRange = newRange;
  }

  get start() {
    return this.newRange.start;
  }

  get oldExtent() {
    return this.oldRange.getExtent();
  }

  get newExtent() {
    return this.newRange.getExtent();
  }
}
