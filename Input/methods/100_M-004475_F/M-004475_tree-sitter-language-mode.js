_forEachTreeWithRange(range, callback) {
  if (this.rootLanguageLayer.tree) {
    callback(this.rootLanguageLayer.tree, this.rootLanguageLayer.grammar);
  }

  const injectionMarkers = this.injectionsMarkerLayer.findMarkers({
    intersectsRange: range
  });

  for (const injectionMarker of injectionMarkers) {
    const { tree, grammar } = injectionMarker.languageLayer;
    if (tree) callback(tree, grammar);
  }
}
