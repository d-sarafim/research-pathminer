class SelectorBasedListener {
  constructor(selector, commandName, listener) {
    this.selector = selector;
    this.didDispatch = extractDidDispatch(listener);
    this.descriptor = extractDescriptor(commandName, listener);
    this.specificity = calculateSpecificity(this.selector);
    this.sequenceNumber = SequenceCount++;
  }

  compare(other) {
    return (
      this.specificity - other.specificity ||
      this.sequenceNumber - other.sequenceNumber
    );
  }

  matchesTarget(target) {
    return (
      target.webkitMatchesSelector &&
      target.webkitMatchesSelector(this.selector)
    );
  }
}
