innerBoundaryIsParser(node, objectStack) {
  /** @type {Array<number>|undefined} */
  const flatLinearRing = pushParseAndPop(
    undefined,
    this.RING_PARSERS,
    node,
    objectStack,
    this
  );
  if (flatLinearRing) {
    const flatLinearRings =
      /** @type {Array<Array<number>>} */
      (objectStack[objectStack.length - 1]);
    flatLinearRings.push(flatLinearRing);
  }
}
