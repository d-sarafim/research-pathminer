class HighlightIterator {
  constructor(languageMode) {
    this.languageMode = languageMode;
    this.iterators = null;
  }

  seek(targetPosition, endRow) {
    const injectionMarkers = this.languageMode.injectionsMarkerLayer.findMarkers(
      {
        intersectsRange: new Range(targetPosition, new Point(endRow + 1, 0))
      }
    );

    const containingTags = [];
    const containingTagStartIndices = [];
    const targetIndex = this.languageMode.buffer.characterIndexForPosition(
      targetPosition
    );

    this.iterators = [];
    const iterator = this.languageMode.rootLanguageLayer.buildHighlightIterator();
    if (iterator.seek(targetIndex, containingTags, containingTagStartIndices)) {
      this.iterators.push(iterator);
    }

    // Populate the iterators array with all of the iterators whose syntax
    // trees span the given position.
    for (const marker of injectionMarkers) {
      const iterator = marker.languageLayer.buildHighlightIterator();
      if (
        iterator.seek(targetIndex, containingTags, containingTagStartIndices)
      ) {
        this.iterators.push(iterator);
      }
    }

    // Sort the iterators so that the last one in the array is the earliest
    // in the document, and represents the current position.
    this.iterators.sort((a, b) => b.compare(a));
    this.detectCoveredScope();

    return containingTags;
  }

  moveToSuccessor() {
    // Advance the earliest layer iterator to its next scope boundary.
    let leader = last(this.iterators);

    // Maintain the sorting of the iterators by their position in the document.
    if (leader.moveToSuccessor()) {
      const leaderIndex = this.iterators.length - 1;
      let i = leaderIndex;
      while (i > 0 && this.iterators[i - 1].compare(leader) < 0) i--;
      if (i < leaderIndex) {
        this.iterators.splice(i, 0, this.iterators.pop());
      }
    } else {
      // If the layer iterator was at the end of its syntax tree, then remove
      // it from the array.
      this.iterators.pop();
    }

    this.detectCoveredScope();
  }

  // Detect whether or not another more deeply-nested language layer has a
  // scope boundary at this same position. If so, the current language layer's
  // scope boundary should not be reported.
  detectCoveredScope() {
    const layerCount = this.iterators.length;
    if (layerCount > 1) {
      const first = this.iterators[layerCount - 1];
      const next = this.iterators[layerCount - 2];
      if (
        next.offset === first.offset &&
        next.atEnd === first.atEnd &&
        next.depth > first.depth &&
        !next.isAtInjectionBoundary()
      ) {
        this.currentScopeIsCovered = true;
        return;
      }
    }
    this.currentScopeIsCovered = false;
  }

  getPosition() {
    const iterator = last(this.iterators);
    if (iterator) {
      return iterator.getPosition();
    } else {
      return Point.INFINITY;
    }
  }

  getCloseScopeIds() {
    const iterator = last(this.iterators);
    if (iterator && !this.currentScopeIsCovered) {
      return iterator.getCloseScopeIds();
    }
    return [];
  }

  getOpenScopeIds() {
    const iterator = last(this.iterators);
    if (iterator && !this.currentScopeIsCovered) {
      return iterator.getOpenScopeIds();
    }
    return [];
  }

  logState() {
    const iterator = last(this.iterators);
    if (iterator && iterator.treeCursor) {
      console.log(
        iterator.getPosition(),
        iterator.treeCursor.nodeType,
        `depth=${iterator.languageLayer.depth}`,
        new Range(
          iterator.languageLayer.tree.rootNode.startPosition,
          iterator.languageLayer.tree.rootNode.endPosition
        ).toString()
      );
      if (this.currentScopeIsCovered) {
        console.log('covered');
      } else {
        console.log(
          'close',
          iterator.closeTags.map(id =>
            this.languageMode.grammar.scopeNameForScopeId(id)
          )
        );
        console.log(
          'open',
          iterator.openTags.map(id =>
            this.languageMode.grammar.scopeNameForScopeId(id)
          )
        );
      }
    }
  }
}
