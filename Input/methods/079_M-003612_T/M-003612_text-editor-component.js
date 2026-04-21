didMouseDownOnContent(event) {
  const { model } = this.props;
  const { target, button, detail, ctrlKey, shiftKey, metaKey } = event;
  const platform = this.getPlatform();

  // Ignore clicks on block decorations.
  if (target) {
    let element = target;
    while (element && element !== this.element) {
      if (this.blockDecorationsByElement.has(element)) {
        return;
      }

      element = element.parentElement;
    }
  }

  const screenPosition = this.screenPositionForMouseEvent(event);

  if (button === 1) {
    model.setCursorScreenPosition(screenPosition, { autoscroll: false });

    // On Linux, pasting happens on middle click. A textInput event with the
    // contents of the selection clipboard will be dispatched by the browser
    // automatically on mouseup if editor.selectionClipboard is set to true.
    if (
      platform === 'linux' &&
      this.isInputEnabled() &&
      atom.config.get('editor.selectionClipboard')
    )
      model.insertText(clipboard.readText('selection'));
    return;
  }

  if (button !== 0) return;

  // Ctrl-click brings up the context menu on macOS
  if (platform === 'darwin' && ctrlKey) return;

  if (target && target.matches('.fold-marker')) {
    const bufferPosition = model.bufferPositionForScreenPosition(
      screenPosition
    );
    model.destroyFoldsContainingBufferPositions([bufferPosition], false);
    return;
  }

  const allowMultiCursor = atom.config.get('editor.multiCursorOnClick');
  const addOrRemoveSelection =
    allowMultiCursor && (metaKey || (ctrlKey && platform !== 'darwin'));

  switch (detail) {
    case 1:
      if (addOrRemoveSelection) {
        const existingSelection = model.getSelectionAtScreenPosition(
          screenPosition
        );
        if (existingSelection) {
          if (model.hasMultipleCursors()) existingSelection.destroy();
        } else {
          model.addCursorAtScreenPosition(screenPosition, {
            autoscroll: false
          });
        }
      } else {
        if (shiftKey) {
          model.selectToScreenPosition(screenPosition, { autoscroll: false });
        } else {
          model.setCursorScreenPosition(screenPosition, {
            autoscroll: false
          });
        }
      }
      break;
    case 2:
      if (addOrRemoveSelection)
        model.addCursorAtScreenPosition(screenPosition, {
          autoscroll: false
        });
      model.getLastSelection().selectWord({ autoscroll: false });
      break;
    case 3:
      if (addOrRemoveSelection)
        model.addCursorAtScreenPosition(screenPosition, {
          autoscroll: false
        });
      model.getLastSelection().selectLine(null, { autoscroll: false });
      break;
  }

  this.handleMouseDragUntilMouseUp({
    didDrag: event => {
      this.autoscrollOnMouseDrag(event);
      const screenPosition = this.screenPositionForMouseEvent(event);
      model.selectToScreenPosition(screenPosition, {
        suppressSelectionMerge: true,
        autoscroll: false
      });
      this.updateSync();
    },
    didStopDragging: () => {
      model.finalizeSelections();
      model.mergeIntersectingSelections();
      this.updateSync();
    }
  });
}
