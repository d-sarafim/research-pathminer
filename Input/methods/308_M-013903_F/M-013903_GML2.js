writeEnvelope(node, extent, objectStack) {
  const context = objectStack[objectStack.length - 1];
  const srsName = context['srsName'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  const keys = ['lowerCorner', 'upperCorner'];
  const values = [extent[0] + ' ' + extent[1], extent[2] + ' ' + extent[3]];
  pushSerializeAndPop(
    /** @type {import("../xml.js").NodeStackItem} */
    ({node: node}),
    this.ENVELOPE_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    values,
    objectStack,
    keys,
    this
  );
}
