update(params) {
  const displayLayerParams = {};

  for (let param of Object.keys(params)) {
    const value = params[param];

    switch (param) {
      case 'autoIndent':
        this.updateAutoIndent(value, false);
        break;

      case 'autoIndentOnPaste':
        this.updateAutoIndentOnPaste(value, false);
        break;

      case 'undoGroupingInterval':
        this.updateUndoGroupingInterval(value, false);
        break;

      case 'scrollSensitivity':
        this.updateScrollSensitivity(value, false);
        break;

      case 'encoding':
        this.updateEncoding(value, false);
        break;

      case 'softTabs':
        this.updateSoftTabs(value, false);
        break;

      case 'atomicSoftTabs':
        this.updateAtomicSoftTabs(value, false, displayLayerParams);
        break;

      case 'tabLength':
        this.updateTabLength(value, false, displayLayerParams);
        break;

      case 'softWrapped':
        this.updateSoftWrapped(value, false, displayLayerParams);
        break;

      case 'softWrapHangingIndentLength':
        this.updateSoftWrapHangingIndentLength(
          value,
          false,
          displayLayerParams
        );
        break;

      case 'softWrapAtPreferredLineLength':
        this.updateSoftWrapAtPreferredLineLength(
          value,
          false,
          displayLayerParams
        );
        break;

      case 'preferredLineLength':
        this.updatePreferredLineLength(value, false, displayLayerParams);
        break;

      case 'maxScreenLineLength':
        this.updateMaxScreenLineLength(value, false, displayLayerParams);
        break;

      case 'mini':
        this.updateMini(value, false, displayLayerParams);
        break;

      case 'readOnly':
        this.updateReadOnly(value, false);
        break;

      case 'keyboardInputEnabled':
        this.updateKeyboardInputEnabled(value, false);
        break;

      case 'placeholderText':
        this.updatePlaceholderText(value, false);
        break;

      case 'lineNumberGutterVisible':
        this.updateLineNumberGutterVisible(value, false);
        break;

      case 'showIndentGuide':
        this.updateShowIndentGuide(value, false, displayLayerParams);
        break;

      case 'showLineNumbers':
        this.updateShowLineNumbers(value, false);
        break;

      case 'showInvisibles':
        this.updateShowInvisibles(value, false, displayLayerParams);
        break;

      case 'invisibles':
        this.updateInvisibles(value, false, displayLayerParams);
        break;

      case 'editorWidthInChars':
        this.updateEditorWidthInChars(value, false, displayLayerParams);
        break;

      case 'width':
        this.updateWidth(value, false, displayLayerParams);
        break;

      case 'scrollPastEnd':
        this.updateScrollPastEnd(value, false);
        break;

      case 'autoHeight':
        this.updateAutoHight(value, false);
        break;

      case 'autoWidth':
        this.updateAutoWidth(value, false);
        break;

      case 'showCursorOnSelection':
        this.updateShowCursorOnSelection(value, false);
        break;

      default:
        if (param !== 'ref' && param !== 'key') {
          throw new TypeError(`Invalid TextEditor parameter: '${param}'`);
        }
    }
  }

  return this.finishUpdate(displayLayerParams);
}
