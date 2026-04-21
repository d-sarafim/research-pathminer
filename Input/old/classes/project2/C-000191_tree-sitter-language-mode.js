class TreeSitterLanguageMode {
  static _patchSyntaxNode() {
    if (!Parser.SyntaxNode.prototype.hasOwnProperty('range')) {
      Object.defineProperty(Parser.SyntaxNode.prototype, 'range', {
        get() {
          return rangeForNode(this);
        }
      });
    }
  }

  constructor({ buffer, grammar, config, grammars, syncTimeoutMicros }) {
    TreeSitterLanguageMode._patchSyntaxNode();
    this.id = nextId++;
    this.buffer = buffer;
    this.grammar = grammar;
    this.config = config;
    this.grammarRegistry = grammars;
    this.rootLanguageLayer = new LanguageLayer(null, this, grammar, 0);
    this.injectionsMarkerLayer = buffer.addMarkerLayer();

    if (syncTimeoutMicros != null) {
      this.syncTimeoutMicros = syncTimeoutMicros;
    }

    this.rootScopeDescriptor = new ScopeDescriptor({
      scopes: [this.grammar.scopeName]
    });
    this.emitter = new Emitter();
    this.isFoldableCache = [];
    this.hasQueuedParse = false;

    this.grammarForLanguageString = this.grammarForLanguageString.bind(this);

    this.rootLanguageLayer
      .update(null)
      .then(() => this.emitter.emit('did-tokenize'));

    // TODO: Remove this once TreeSitterLanguageMode implements its own auto-indentation system. This
    // is temporarily needed in order to delegate to the TextMateLanguageMode's auto-indent system.
    this.regexesByPattern = {};
  }

  async parseCompletePromise() {
    let done = false;
    while (!done) {
      if (this.rootLanguageLayer.currentParsePromise) {
        await this.rootLanguageLayer.currentParsePromises;
      } else {
        done = true;
        for (const marker of this.injectionsMarkerLayer.getMarkers()) {
          if (marker.languageLayer.currentParsePromise) {
            done = false;
            await marker.languageLayer.currentParsePromise;
            break;
          }
        }
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  destroy() {
    this.injectionsMarkerLayer.destroy();
    this.rootLanguageLayer = null;
  }

  getLanguageId() {
    return this.grammar.scopeName;
  }

  bufferDidChange({ oldRange, newRange, oldText, newText }) {
    const edit = this.rootLanguageLayer._treeEditForBufferChange(
      oldRange.start,
      oldRange.end,
      newRange.end,
      oldText,
      newText
    );
    this.rootLanguageLayer.handleTextChange(edit, oldText, newText);
    for (const marker of this.injectionsMarkerLayer.getMarkers()) {
      marker.languageLayer.handleTextChange(edit, oldText, newText);
    }
  }

  bufferDidFinishTransaction({ changes }) {
    for (let i = 0, { length } = changes; i < length; i++) {
      const { oldRange, newRange } = changes[i];
      spliceArray(
        this.isFoldableCache,
        newRange.start.row,
        oldRange.end.row - oldRange.start.row,
        { length: newRange.end.row - newRange.start.row }
      );
    }
    this.rootLanguageLayer.update(null);
  }

  parse(language, oldTree, ranges) {
    const parser = PARSER_POOL.pop() || new Parser();
    parser.setLanguage(language);
    const result = parser.parseTextBuffer(this.buffer.buffer, oldTree, {
      syncTimeoutMicros: this.syncTimeoutMicros,
      includedRanges: ranges
    });

    if (result.then) {
      return result.then(tree => {
        PARSER_POOL.push(parser);
        return tree;
      });
    } else {
      PARSER_POOL.push(parser);
      return result;
    }
  }

  get tree() {
    return this.rootLanguageLayer.tree;
  }

  updateForInjection(grammar) {
    this.rootLanguageLayer.updateInjections(grammar);
  }

  /*
  Section - Highlighting
  */

  buildHighlightIterator() {
    if (!this.rootLanguageLayer) return new NullLanguageModeHighlightIterator();
    return new HighlightIterator(this);
  }

  onDidTokenize(callback) {
    return this.emitter.on('did-tokenize', callback);
  }

  onDidChangeHighlighting(callback) {
    return this.emitter.on('did-change-highlighting', callback);
  }

  classNameForScopeId(scopeId) {
    return this.grammar.classNameForScopeId(scopeId);
  }

  /*
  Section - Commenting
  */

  commentStringsForPosition(position) {
    const range =
      this.firstNonWhitespaceRange(position.row) ||
      new Range(position, position);
    const { grammar } = this.getSyntaxNodeAndGrammarContainingRange(range);
    return grammar.commentStrings;
  }

  isRowCommented(row) {
    const range = this.firstNonWhitespaceRange(row);
    if (range) {
      const firstNode = this.getSyntaxNodeContainingRange(range);
      if (firstNode) return firstNode.type.includes('comment');
    }
    return false;
  }

  /*
  Section - Indentation
  */

  suggestedIndentForLineAtBufferRow(row, line, tabLength) {
    return this._suggestedIndentForLineWithScopeAtBufferRow(
      row,
      line,
      this.rootScopeDescriptor,
      tabLength
    );
  }

  suggestedIndentForBufferRow(row, tabLength, options) {
    if (!this.treeIndenter) {
      this.treeIndenter = new TreeIndenter(this);
    }

    if (this.treeIndenter.isConfigured) {
      const indent = this.treeIndenter.suggestedIndentForBufferRow(
        row,
        tabLength,
        options
      );
      return indent;
    } else {
      return this._suggestedIndentForLineWithScopeAtBufferRow(
        row,
        this.buffer.lineForRow(row),
        this.rootScopeDescriptor,
        tabLength,
        options
      );
    }
  }

  indentLevelForLine(line, tabLength) {
    let indentLength = 0;
    for (let i = 0, { length } = line; i < length; i++) {
      const char = line[i];
      if (char === '\t') {
        indentLength += tabLength - (indentLength % tabLength);
      } else if (char === ' ') {
        indentLength++;
      } else {
        break;
      }
    }
    return indentLength / tabLength;
  }

  /*
  Section - Folding
  */

  isFoldableAtRow(row) {
    if (this.isFoldableCache[row] != null) return this.isFoldableCache[row];
    const result =
      this.getFoldableRangeContainingPoint(Point(row, Infinity), 0, true) !=
      null;
    this.isFoldableCache[row] = result;
    return result;
  }

  getFoldableRanges() {
    return this.getFoldableRangesAtIndentLevel(null);
  }

  /**
   * TODO: Make this method generate folds for nested languages (currently,
   * folds are only generated for the root language layer).
   */
  getFoldableRangesAtIndentLevel(goalLevel) {
    let result = [];
    let stack = [{ node: this.tree.rootNode, level: 0 }];
    while (stack.length > 0) {
      const { node, level } = stack.pop();

      const range = this.getFoldableRangeForNode(node, this.grammar);
      if (range) {
        if (goalLevel == null || level === goalLevel) {
          let updatedExistingRange = false;
          for (let i = 0, { length } = result; i < length; i++) {
            if (
              result[i].start.row === range.start.row &&
              result[i].end.row === range.end.row
            ) {
              result[i] = range;
              updatedExistingRange = true;
              break;
            }
          }
          if (!updatedExistingRange) result.push(range);
        }
      }

      const parentStartRow = node.startPosition.row;
      const parentEndRow = node.endPosition.row;
      for (
        let children = node.namedChildren, i = 0, { length } = children;
        i < length;
        i++
      ) {
        const child = children[i];
        const { startPosition: childStart, endPosition: childEnd } = child;
        if (childEnd.row > childStart.row) {
          if (
            childStart.row === parentStartRow &&
            childEnd.row === parentEndRow
          ) {
            stack.push({ node: child, level: level });
          } else {
            const childLevel =
              range &&
              range.containsPoint(childStart) &&
              range.containsPoint(childEnd)
                ? level + 1
                : level;
            if (childLevel <= goalLevel || goalLevel == null) {
              stack.push({ node: child, level: childLevel });
            }
          }
        }
      }
    }

    return result.sort((a, b) => a.start.row - b.start.row);
  }

  getFoldableRangeContainingPoint(point, tabLength, existenceOnly = false) {
    if (!this.tree) return null;

    let smallestRange;
    this._forEachTreeWithRange(new Range(point, point), (tree, grammar) => {
      let node = tree.rootNode.descendantForPosition(
        this.buffer.clipPosition(point)
      );
      while (node) {
        if (existenceOnly && node.startPosition.row < point.row) return;
        if (node.endPosition.row > point.row) {
          const range = this.getFoldableRangeForNode(node, grammar);
          if (range && rangeIsSmaller(range, smallestRange)) {
            smallestRange = range;
            return;
          }
        }
        node = node.parent;
      }
    });

    return existenceOnly
      ? smallestRange && smallestRange.start.row === point.row
      : smallestRange;
  }

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

  getFoldableRangeForNode(node, grammar, existenceOnly) {
    const { children } = node;
    const childCount = children.length;

    for (var i = 0, { length } = grammar.folds; i < length; i++) {
      const foldSpec = grammar.folds[i];

      if (foldSpec.matchers && !hasMatchingFoldSpec(foldSpec.matchers, node))
        continue;

      let foldStart;
      const startEntry = foldSpec.start;
      if (startEntry) {
        let foldStartNode;
        if (startEntry.index != null) {
          foldStartNode = children[startEntry.index];
          if (
            !foldStartNode ||
            (startEntry.matchers &&
              !hasMatchingFoldSpec(startEntry.matchers, foldStartNode))
          )
            continue;
        } else {
          foldStartNode = children.find(child =>
            hasMatchingFoldSpec(startEntry.matchers, child)
          );
          if (!foldStartNode) continue;
        }
        foldStart = new Point(foldStartNode.endPosition.row, Infinity);
      } else {
        foldStart = new Point(node.startPosition.row, Infinity);
      }

      let foldEnd;
      const endEntry = foldSpec.end;
      if (endEntry) {
        let foldEndNode;
        if (endEntry.index != null) {
          const index =
            endEntry.index < 0 ? childCount + endEntry.index : endEntry.index;
          foldEndNode = children[index];
          if (
            !foldEndNode ||
            (endEntry.type && endEntry.type !== foldEndNode.type)
          )
            continue;
        } else {
          foldEndNode = children.find(child =>
            hasMatchingFoldSpec(endEntry.matchers, child)
          );
          if (!foldEndNode) continue;
        }

        if (foldEndNode.startPosition.row <= foldStart.row) continue;

        foldEnd = foldEndNode.startPosition;
        if (
          this.buffer.findInRangeSync(
            WORD_REGEX,
            new Range(foldEnd, new Point(foldEnd.row, Infinity))
          )
        ) {
          foldEnd = new Point(foldEnd.row - 1, Infinity);
        }
      } else {
        const { endPosition } = node;
        if (endPosition.column === 0) {
          foldEnd = Point(endPosition.row - 1, Infinity);
        } else if (childCount > 0) {
          foldEnd = endPosition;
        } else {
          foldEnd = Point(endPosition.row, 0);
        }
      }

      return existenceOnly ? true : new Range(foldStart, foldEnd);
    }
  }

  /*
  Section - Syntax Tree APIs
  */

  getSyntaxNodeContainingRange(range, where = _ => true) {
    return this.getSyntaxNodeAndGrammarContainingRange(range, where).node;
  }

  getSyntaxNodeAndGrammarContainingRange(range, where = _ => true) {
    const startIndex = this.buffer.characterIndexForPosition(range.start);
    const endIndex = this.buffer.characterIndexForPosition(range.end);
    const searchEndIndex = Math.max(0, endIndex - 1);

    let smallestNode = null;
    let smallestNodeGrammar = this.grammar;
    this._forEachTreeWithRange(range, (tree, grammar) => {
      let node = tree.rootNode.descendantForIndex(startIndex, searchEndIndex);
      while (node) {
        if (
          nodeContainsIndices(node, startIndex, endIndex) &&
          where(node, grammar)
        ) {
          if (nodeIsSmaller(node, smallestNode)) {
            smallestNode = node;
            smallestNodeGrammar = grammar;
          }
          break;
        }
        node = node.parent;
      }
    });

    return { node: smallestNode, grammar: smallestNodeGrammar };
  }

  getRangeForSyntaxNodeContainingRange(range, where) {
    const node = this.getSyntaxNodeContainingRange(range, where);
    return node && node.range;
  }

  getSyntaxNodeAtPosition(position, where) {
    return this.getSyntaxNodeContainingRange(
      new Range(position, position),
      where
    );
  }

  bufferRangeForScopeAtPosition(selector, position) {
    const nodeCursorAdapter = new NodeCursorAdaptor();
    if (typeof selector === 'string') {
      const match = matcherForSelector(selector);
      selector = (node, grammar) => {
        const rules = grammar.scopeMap.get([node.type], [0], node.named);
        nodeCursorAdapter.node = node;
        const scopeName = applyLeafRules(rules, nodeCursorAdapter);
        if (scopeName != null) {
          return match(scopeName);
        }
      };
    }
    if (selector === null) selector = undefined;
    const node = this.getSyntaxNodeAtPosition(position, selector);
    return node && node.range;
  }

  /*
  Section - Backward compatibility shims
  */

  tokenizedLineForRow(row) {
    const lineText = this.buffer.lineForRow(row);
    const tokens = [];

    const iterator = this.buildHighlightIterator();
    let start = { row, column: 0 };
    const scopes = iterator.seek(start, row);
    while (true) {
      const end = iterator.getPosition();
      if (end.row > row) {
        end.row = row;
        end.column = lineText.length;
      }

      if (end.column > start.column) {
        tokens.push(
          new Token({
            value: lineText.substring(start.column, end.column),
            scopes: scopes.map(s => this.grammar.scopeNameForScopeId(s))
          })
        );
      }

      if (end.column < lineText.length) {
        const closeScopeCount = iterator.getCloseScopeIds().length;
        for (let i = 0; i < closeScopeCount; i++) {
          scopes.pop();
        }
        scopes.push(...iterator.getOpenScopeIds());
        start = end;
        iterator.moveToSuccessor();
      } else {
        break;
      }
    }

    return new TokenizedLine({
      openScopes: [],
      text: lineText,
      tokens,
      tags: [],
      ruleStack: [],
      lineEnding: this.buffer.lineEndingForRow(row),
      tokenIterator: null,
      grammar: this.grammar
    });
  }

  syntaxTreeScopeDescriptorForPosition(point) {
    const nodes = [];
    point = this.buffer.clipPosition(Point.fromObject(point));

    // If the position is the end of a line, get node of left character instead of newline
    // This is to match TextMate behaviour, see https://github.com/atom/atom/issues/18463
    if (
      point.column > 0 &&
      point.column === this.buffer.lineLengthForRow(point.row)
    ) {
      point = point.copy();
      point.column--;
    }

    this._forEachTreeWithRange(new Range(point, point), tree => {
      let node = tree.rootNode.descendantForPosition(point);
      while (node) {
        nodes.push(node);
        node = node.parent;
      }
    });

    // The nodes are mostly already sorted from smallest to largest,
    // but for files with multiple syntax trees (e.g. ERB), each tree's
    // nodes are separate. Sort the nodes from largest to smallest.
    nodes.reverse();
    nodes.sort(
      (a, b) => a.startIndex - b.startIndex || b.endIndex - a.endIndex
    );

    const nodeTypes = nodes.map(node => node.type);
    nodeTypes.unshift(this.grammar.scopeName);
    return new ScopeDescriptor({ scopes: nodeTypes });
  }

  scopeDescriptorForPosition(point) {
    point = this.buffer.clipPosition(Point.fromObject(point));

    // If the position is the end of a line, get scope of left character instead of newline
    // This is to match TextMate behaviour, see https://github.com/atom/atom/issues/18463
    if (
      point.column > 0 &&
      point.column === this.buffer.lineLengthForRow(point.row)
    ) {
      point = point.copy();
      point.column--;
    }

    const iterator = this.buildHighlightIterator();
    const scopes = [];
    for (const scope of iterator.seek(point, point.row + 1)) {
      scopes.push(this.grammar.scopeNameForScopeId(scope));
    }
    if (point.isEqual(iterator.getPosition())) {
      for (const scope of iterator.getOpenScopeIds()) {
        scopes.push(this.grammar.scopeNameForScopeId(scope));
      }
    }
    if (scopes.length === 0 || scopes[0] !== this.grammar.scopeName) {
      scopes.unshift(this.grammar.scopeName);
    }
    return new ScopeDescriptor({ scopes });
  }

  tokenForPosition(point) {
    const node = this.getSyntaxNodeAtPosition(point);
    const scopes = this.scopeDescriptorForPosition(point).getScopesArray();
    return new Token({ value: node.text, scopes });
  }

  getGrammar() {
    return this.grammar;
  }

  /*
  Section - Private
  */

  firstNonWhitespaceRange(row) {
    return this.buffer.findInRangeSync(
      /\S/,
      new Range(new Point(row, 0), new Point(row, Infinity))
    );
  }

  grammarForLanguageString(languageString) {
    return this.grammarRegistry.treeSitterGrammarForLanguageString(
      languageString
    );
  }

  emitRangeUpdate(range) {
    const startRow = range.start.row;
    const endRow = range.end.row;
    for (let row = startRow; row < endRow; row++) {
      this.isFoldableCache[row] = undefined;
    }
    this.emitter.emit('did-change-highlighting', range);
  }
}
