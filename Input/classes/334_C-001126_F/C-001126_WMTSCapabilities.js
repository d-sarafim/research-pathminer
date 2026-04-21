class WMTSCapabilities extends XML {
  constructor() {
    super();

    /**
     * @type {OWS}
     * @private
     */
    this.owsParser_ = new OWS();
  }

  /**
   * @param {Element} node Node.
   * @return {Object} Object
   */
  readFromNode(node) {
    let version = node.getAttribute('version');
    if (version) {
      version = version.trim();
    }
    let WMTSCapabilityObject = this.owsParser_.readFromNode(node);
    if (!WMTSCapabilityObject) {
      return null;
    }
    WMTSCapabilityObject['version'] = version;
    WMTSCapabilityObject = pushParseAndPop(
      WMTSCapabilityObject,
      PARSERS,
      node,
      []
    );
    return WMTSCapabilityObject ? WMTSCapabilityObject : null;
  }
}
