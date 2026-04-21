_populateInjections(range, nodeRangeSet) {
  const existingInjectionMarkers = this.languageMode.injectionsMarkerLayer
    .findMarkers({ intersectsRange: range })
    .filter(marker => marker.parentLanguageLayer === this);

  if (existingInjectionMarkers.length > 0) {
    range = range.union(
      new Range(
        existingInjectionMarkers[0].getRange().start,
        last(existingInjectionMarkers).getRange().end
      )
    );
  }

  const markersToUpdate = new Map();
  const nodes = this.tree.rootNode.descendantsOfType(
    Object.keys(this.grammar.injectionPointsByType),
    range.start,
    range.end
  );

  let existingInjectionMarkerIndex = 0;
  for (const node of nodes) {
    for (const injectionPoint of this.grammar.injectionPointsByType[
      node.type
    ]) {
      const languageName = injectionPoint.language(node);
      if (!languageName) continue;

      const grammar = this.languageMode.grammarForLanguageString(
        languageName
      );
      if (!grammar) continue;

      const contentNodes = injectionPoint.content(node);
      if (!contentNodes) continue;

      const injectionNodes = [].concat(contentNodes);
      if (!injectionNodes.length) continue;

      const injectionRange = rangeForNode(node);

      let marker;
      for (
        let i = existingInjectionMarkerIndex,
          n = existingInjectionMarkers.length;
        i < n;
        i++
      ) {
        const existingMarker = existingInjectionMarkers[i];
        const comparison = existingMarker.getRange().compare(injectionRange);
        if (comparison > 0) {
          break;
        } else if (comparison === 0) {
          existingInjectionMarkerIndex = i;
          if (existingMarker.languageLayer.grammar === grammar) {
            marker = existingMarker;
            break;
          }
        } else {
          existingInjectionMarkerIndex = i;
        }
      }

      if (!marker) {
        marker = this.languageMode.injectionsMarkerLayer.markRange(
          injectionRange
        );
        marker.languageLayer = new LanguageLayer(
          marker,
          this.languageMode,
          grammar,
          this.depth + 1
        );
        marker.parentLanguageLayer = this;
      }

      markersToUpdate.set(
        marker,
        new NodeRangeSet(
          nodeRangeSet,
          injectionNodes,
          injectionPoint.newlinesBetween,
          injectionPoint.includeChildren
        )
      );
    }
  }

  for (const marker of existingInjectionMarkers) {
    if (!markersToUpdate.has(marker)) {
      this.languageMode.emitRangeUpdate(marker.getRange());
      marker.languageLayer.destroy();
    }
  }

  if (markersToUpdate.size > 0) {
    const promises = [];
    for (const [marker, nodeRangeSet] of markersToUpdate) {
      promises.push(marker.languageLayer.update(nodeRangeSet));
    }
    return Promise.all(promises);
  }
}
