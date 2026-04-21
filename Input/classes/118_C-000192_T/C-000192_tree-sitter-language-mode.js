class LanguageLayer {
  constructor(marker, languageMode, grammar, depth) {
    this.marker = marker;
    this.languageMode = languageMode;
    this.grammar = grammar;
    this.tree = null;
    this.currentParsePromise = null;
    this.patchSinceCurrentParseStarted = null;
    this.depth = depth;
  }

  buildHighlightIterator() {
    if (this.tree) {
      return new LayerHighlightIterator(this, this.tree.walk());
    } else {
      return new NullLayerHighlightIterator();
    }
  }

  handleTextChange(edit, oldText, newText) {
    const { startPosition, oldEndPosition, newEndPosition } = edit;

    if (this.tree) {
      this.tree.edit(edit);
      if (this.editedRange) {
        if (startPosition.isLessThan(this.editedRange.start)) {
          this.editedRange.start = startPosition;
        }
        if (oldEndPosition.isLessThan(this.editedRange.end)) {
          this.editedRange.end = newEndPosition.traverse(
            this.editedRange.end.traversalFrom(oldEndPosition)
          );
        } else {
          this.editedRange.end = newEndPosition;
        }
      } else {
        this.editedRange = new Range(startPosition, newEndPosition);
      }
    }

    if (this.patchSinceCurrentParseStarted) {
      this.patchSinceCurrentParseStarted.splice(
        startPosition,
        oldEndPosition.traversalFrom(startPosition),
        newEndPosition.traversalFrom(startPosition),
        oldText,
        newText
      );
    }
  }

  destroy() {
    this.tree = null;
    this.destroyed = true;
    this.marker.destroy();
    for (const marker of this.languageMode.injectionsMarkerLayer.getMarkers()) {
      if (marker.parentLanguageLayer === this) {
        marker.languageLayer.destroy();
      }
    }
  }

  async update(nodeRangeSet) {
    if (!this.currentParsePromise) {
      while (
        !this.destroyed &&
        (!this.tree || this.tree.rootNode.hasChanges())
      ) {
        const params = { async: false };
        this.currentParsePromise = this._performUpdate(nodeRangeSet, params);
        if (!params.async) break;
        await this.currentParsePromise;
      }
      this.currentParsePromise = null;
    }
  }

  updateInjections(grammar) {
    if (grammar.injectionRegex) {
      if (!this.currentParsePromise)
        this.currentParsePromise = Promise.resolve();
      this.currentParsePromise = this.currentParsePromise.then(async () => {
        await this._populateInjections(MAX_RANGE, null);
        this.currentParsePromise = null;
      });
    }
  }

  async _performUpdate(nodeRangeSet, params) {
    let includedRanges = null;
    if (nodeRangeSet) {
      includedRanges = nodeRangeSet.getRanges(this.languageMode.buffer);
      if (includedRanges.length === 0) {
        const range = this.marker.getRange();
        this.destroy();
        this.languageMode.emitRangeUpdate(range);
        return;
      }
    }

    let affectedRange = this.editedRange;
    this.editedRange = null;

    this.patchSinceCurrentParseStarted = new Patch();
    let tree = this.languageMode.parse(
      this.grammar.languageModule,
      this.tree,
      includedRanges
    );
    if (tree.then) {
      params.async = true;
      tree = await tree;
    }

    const changes = this.patchSinceCurrentParseStarted.getChanges();
    this.patchSinceCurrentParseStarted = null;
    for (const {
      oldStart,
      newStart,
      oldEnd,
      newEnd,
      oldText,
      newText
    } of changes) {
      const newExtent = Point.fromObject(newEnd).traversalFrom(newStart);
      tree.edit(
        this._treeEditForBufferChange(
          newStart,
          oldEnd,
          Point.fromObject(oldStart).traverse(newExtent),
          oldText,
          newText
        )
      );
    }

    if (this.tree) {
      const rangesWithSyntaxChanges = this.tree.getChangedRanges(tree);
      this.tree = tree;

      if (rangesWithSyntaxChanges.length > 0) {
        for (const range of rangesWithSyntaxChanges) {
          this.languageMode.emitRangeUpdate(rangeForNode(range));
        }

        const combinedRangeWithSyntaxChange = new Range(
          rangesWithSyntaxChanges[0].startPosition,
          last(rangesWithSyntaxChanges).endPosition
        );

        if (affectedRange) {
          this.languageMode.emitRangeUpdate(affectedRange);
          affectedRange = affectedRange.union(combinedRangeWithSyntaxChange);
        } else {
          affectedRange = combinedRangeWithSyntaxChange;
        }
      }
    } else {
      this.tree = tree;
      this.languageMode.emitRangeUpdate(rangeForNode(tree.rootNode));
      if (includedRanges) {
        affectedRange = new Range(
          includedRanges[0].startPosition,
          last(includedRanges).endPosition
        );
      } else {
        affectedRange = MAX_RANGE;
      }
    }

    if (affectedRange) {
      const injectionPromise = this._populateInjections(
        affectedRange,
        nodeRangeSet
      );
      if (injectionPromise) {
        params.async = true;
        return injectionPromise;
      }
    }
  }

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

  _treeEditForBufferChange(start, oldEnd, newEnd, oldText, newText) {
    const startIndex = this.languageMode.buffer.characterIndexForPosition(
      start
    );
    return {
      startIndex,
      oldEndIndex: startIndex + oldText.length,
      newEndIndex: startIndex + newText.length,
      startPosition: start,
      oldEndPosition: oldEnd,
      newEndPosition: newEnd
    };
  }
}
