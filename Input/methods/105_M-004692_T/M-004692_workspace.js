async open(itemOrURI, options = {}) {
  let uri, item;
  if (typeof itemOrURI === 'string') {
    uri = this.project.resolvePath(itemOrURI);
  } else if (itemOrURI) {
    item = itemOrURI;
    if (typeof item.getURI === 'function') uri = item.getURI();
  }

  let resolveItem = () => {};
  if (uri) {
    const incomingItem = this.incoming.get(uri);
    if (!incomingItem) {
      this.incoming.set(
        uri,
        new Promise(resolve => {
          resolveItem = resolve;
        })
      );
    } else {
      await incomingItem;
    }
  }

  try {
    if (!atom.config.get('core.allowPendingPaneItems')) {
      options.pending = false;
    }

    // Avoid adding URLs as recent documents to work-around this Spotlight crash:
    // https://github.com/atom/atom/issues/10071
    if (uri && (!url.parse(uri).protocol || process.platform === 'win32')) {
      this.applicationDelegate.addRecentDocument(uri);
    }

    let pane, itemExistsInWorkspace;

    // Try to find an existing item in the workspace.
    if (item || uri) {
      if (options.pane) {
        pane = options.pane;
      } else if (options.searchAllPanes) {
        pane = item ? this.paneForItem(item) : this.paneForURI(uri);
      } else {
        // If an item with the given URI is already in the workspace, assume
        // that item's pane container is the preferred location for that URI.
        let container;
        if (uri) container = this.paneContainerForURI(uri);
        if (!container) container = this.getActivePaneContainer();

        // The `split` option affects where we search for the item.
        pane = container.getActivePane();
        switch (options.split) {
          case 'left':
            pane = pane.findLeftmostSibling();
            break;
          case 'right':
            pane = pane.findRightmostSibling();
            break;
          case 'up':
            pane = pane.findTopmostSibling();
            break;
          case 'down':
            pane = pane.findBottommostSibling();
            break;
        }
      }

      if (pane) {
        if (item) {
          itemExistsInWorkspace = pane.getItems().includes(item);
        } else {
          item = pane.itemForURI(uri);
          itemExistsInWorkspace = item != null;
        }
      }
    }

    // If we already have an item at this stage, we won't need to do an async
    // lookup of the URI, so we yield the event loop to ensure this method
    // is consistently asynchronous.
    if (item) await Promise.resolve();

    if (!itemExistsInWorkspace) {
      item = item || (await this.createItemForURI(uri, options));
      if (!item) return;

      if (options.pane) {
        pane = options.pane;
      } else {
        let location = options.location;
        if (!location && !options.split && uri && this.enablePersistence) {
          location = await this.itemLocationStore.load(uri);
        }
        if (!location && typeof item.getDefaultLocation === 'function') {
          location = item.getDefaultLocation();
        }

        const allowedLocations =
          typeof item.getAllowedLocations === 'function'
            ? item.getAllowedLocations()
            : ALL_LOCATIONS;
        location = allowedLocations.includes(location)
          ? location
          : allowedLocations[0];

        const container = this.paneContainers[location] || this.getCenter();
        pane = container.getActivePane();
        switch (options.split) {
          case 'left':
            pane = pane.findLeftmostSibling();
            break;
          case 'right':
            pane = pane.findOrCreateRightmostSibling();
            break;
          case 'up':
            pane = pane.findTopmostSibling();
            break;
          case 'down':
            pane = pane.findOrCreateBottommostSibling();
            break;
        }
      }
    }

    if (!options.pending && pane.getPendingItem() === item) {
      pane.clearPendingItem();
    }

    this.itemOpened(item);

    if (options.activateItem === false) {
      pane.addItem(item, { pending: options.pending });
    } else {
      pane.activateItem(item, { pending: options.pending });
    }

    if (options.activatePane !== false) {
      pane.activate();
    }

    let initialColumn = 0;
    let initialLine = 0;
    if (!Number.isNaN(options.initialLine)) {
      initialLine = options.initialLine;
    }
    if (!Number.isNaN(options.initialColumn)) {
      initialColumn = options.initialColumn;
    }
    if (initialLine >= 0 || initialColumn >= 0) {
      if (typeof item.setCursorBufferPosition === 'function') {
        item.setCursorBufferPosition([initialLine, initialColumn]);
      }
      if (typeof item.unfoldBufferRow === 'function') {
        item.unfoldBufferRow(initialLine);
      }
      if (typeof item.scrollToBufferPosition === 'function') {
        item.scrollToBufferPosition([initialLine, initialColumn], {
          center: true
        });
      }
    }

    const index = pane.getActiveItemIndex();
    this.emitter.emit('did-open', { uri, pane, item, index });
    if (uri) {
      this.incoming.delete(uri);
    }
  } finally {
    resolveItem();
  }
  return item;
}
