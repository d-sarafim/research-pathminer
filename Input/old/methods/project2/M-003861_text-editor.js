constructor(params = {}) {
  if (this.constructor.clipboard == null) {
    throw new Error(
      'Must call TextEditor.setClipboard at least once before creating TextEditor instances'
    );
  }

  this.id = params.id != null ? params.id : nextId++;
  if (this.id >= nextId) {
    // Ensure that new editors get unique ids:
    nextId = this.id + 1;
  }
  this.initialScrollTopRow = params.initialScrollTopRow;
  this.initialScrollLeftColumn = params.initialScrollLeftColumn;
  this.decorationManager = params.decorationManager;
  this.selectionsMarkerLayer = params.selectionsMarkerLayer;
  this.mini = params.mini != null ? params.mini : false;
  this.keyboardInputEnabled =
    params.keyboardInputEnabled != null ? params.keyboardInputEnabled : true;
  this.readOnly = params.readOnly != null ? params.readOnly : false;
  this.placeholderText = params.placeholderText;
  this.showLineNumbers = params.showLineNumbers;
  this.assert = params.assert || (condition => condition);
  this.showInvisibles =
    params.showInvisibles != null ? params.showInvisibles : true;
  this.autoHeight = params.autoHeight;
  this.autoWidth = params.autoWidth;
  this.scrollPastEnd =
    params.scrollPastEnd != null ? params.scrollPastEnd : false;
  this.scrollSensitivity =
    params.scrollSensitivity != null ? params.scrollSensitivity : 40;
  this.editorWidthInChars = params.editorWidthInChars;
  this.invisibles = params.invisibles;
  this.showIndentGuide = params.showIndentGuide;
  this.softWrapped = params.softWrapped;
  this.softWrapAtPreferredLineLength = params.softWrapAtPreferredLineLength;
  this.preferredLineLength = params.preferredLineLength;
  this.showCursorOnSelection =
    params.showCursorOnSelection != null
      ? params.showCursorOnSelection
      : true;
  this.maxScreenLineLength = params.maxScreenLineLength;
  this.softTabs = params.softTabs != null ? params.softTabs : true;
  this.autoIndent = params.autoIndent != null ? params.autoIndent : true;
  this.autoIndentOnPaste =
    params.autoIndentOnPaste != null ? params.autoIndentOnPaste : true;
  this.undoGroupingInterval =
    params.undoGroupingInterval != null ? params.undoGroupingInterval : 300;
  this.softWrapped = params.softWrapped != null ? params.softWrapped : false;
  this.softWrapAtPreferredLineLength =
    params.softWrapAtPreferredLineLength != null
      ? params.softWrapAtPreferredLineLength
      : false;
  this.preferredLineLength =
    params.preferredLineLength != null ? params.preferredLineLength : 80;
  this.maxScreenLineLength =
    params.maxScreenLineLength != null ? params.maxScreenLineLength : 500;
  this.showLineNumbers =
    params.showLineNumbers != null ? params.showLineNumbers : true;
  const { tabLength = 2 } = params;

  this.alive = true;
  this.doBackgroundWork = this.doBackgroundWork.bind(this);
  this.serializationVersion = 1;
  this.suppressSelectionMerging = false;
  this.selectionFlashDuration = 500;
  this.gutterContainer = null;
  this.verticalScrollMargin = 2;
  this.horizontalScrollMargin = 6;
  this.lineHeightInPixels = null;
  this.defaultCharWidth = null;
  this.height = null;
  this.width = null;
  this.registered = false;
  this.atomicSoftTabs = true;
  this.emitter = new Emitter();
  this.disposables = new CompositeDisposable();
  this.cursors = [];
  this.cursorsByMarkerId = new Map();
  this.selections = [];
  this.hasTerminatedPendingState = false;

  if (params.buffer) {
    this.buffer = params.buffer;
  } else {
    this.buffer = new TextBuffer({
      shouldDestroyOnFileDelete() {
        return atom.config.get('core.closeDeletedFileTabs');
      }
    });
    this.buffer.setLanguageMode(
      new TextMateLanguageMode({ buffer: this.buffer, config: atom.config })
    );
  }

  const languageMode = this.buffer.getLanguageMode();
  this.languageModeSubscription =
    languageMode.onDidTokenize &&
    languageMode.onDidTokenize(() => {
      this.emitter.emit('did-tokenize');
    });
  if (this.languageModeSubscription)
    this.disposables.add(this.languageModeSubscription);

  if (params.displayLayer) {
    this.displayLayer = params.displayLayer;
  } else {
    const displayLayerParams = {
      invisibles: this.getInvisibles(),
      softWrapColumn: this.getSoftWrapColumn(),
      showIndentGuides: this.doesShowIndentGuide(),
      atomicSoftTabs:
        params.atomicSoftTabs != null ? params.atomicSoftTabs : true,
      tabLength,
      ratioForCharacter: this.ratioForCharacter.bind(this),
      isWrapBoundary,
      foldCharacter: ZERO_WIDTH_NBSP,
      softWrapHangingIndent:
        params.softWrapHangingIndentLength != null
          ? params.softWrapHangingIndentLength
          : 0
    };

    this.displayLayer = this.buffer.getDisplayLayer(params.displayLayerId);
    if (this.displayLayer) {
      this.displayLayer.reset(displayLayerParams);
      this.selectionsMarkerLayer = this.displayLayer.getMarkerLayer(
        params.selectionsMarkerLayerId
      );
    } else {
      this.displayLayer = this.buffer.addDisplayLayer(displayLayerParams);
    }
  }

  this.backgroundWorkHandle = requestIdleCallback(this.doBackgroundWork);
  this.disposables.add(
    new Disposable(() => {
      if (this.backgroundWorkHandle != null)
        return cancelIdleCallback(this.backgroundWorkHandle);
    })
  );

  this.defaultMarkerLayer = this.displayLayer.addMarkerLayer();
  if (!this.selectionsMarkerLayer) {
    this.selectionsMarkerLayer = this.addMarkerLayer({
      maintainHistory: true,
      persistent: true,
      role: 'selections'
    });
  }

  this.decorationManager = new DecorationManager(this);
  this.decorateMarkerLayer(this.selectionsMarkerLayer, { type: 'cursor' });
  if (!this.isMini()) this.decorateCursorLine();

  this.decorateMarkerLayer(this.displayLayer.foldsMarkerLayer, {
    type: 'line-number',
    class: 'folded'
  });

  for (let marker of this.selectionsMarkerLayer.getMarkers()) {
    this.addSelection(marker);
  }

  this.subscribeToBuffer();
  this.subscribeToDisplayLayer();

  if (this.cursors.length === 0 && !params.suppressCursorCreation) {
    const initialLine = Math.max(parseInt(params.initialLine) || 0, 0);
    const initialColumn = Math.max(parseInt(params.initialColumn) || 0, 0);
    this.addCursorAtBufferPosition([initialLine, initialColumn]);
  }

  this.gutterContainer = new GutterContainer(this);
  this.lineNumberGutter = this.gutterContainer.addGutter({
    name: 'line-number',
    type: 'line-number',
    priority: 0,
    visible: params.lineNumberGutterVisible
  });
}
