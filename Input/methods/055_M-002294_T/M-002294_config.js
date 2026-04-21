unset(keyPath, options) {
  if (!this.settingsLoaded) {
    this.pendingOperations.push(() => this.unset(keyPath, options));
  }

  let { scopeSelector, source } = options != null ? options : {};
  if (source == null) {
    source = this.mainSource;
  }

  if (scopeSelector != null) {
    if (keyPath != null) {
      let settings = this.scopedSettingsStore.propertiesForSourceAndSelector(
        source,
        scopeSelector
      );
      if (getValueAtKeyPath(settings, keyPath) != null) {
        this.scopedSettingsStore.removePropertiesForSourceAndSelector(
          source,
          scopeSelector
        );
        setValueAtKeyPath(settings, keyPath, undefined);
        settings = withoutEmptyObjects(settings);
        if (settings != null) {
          this.set(null, settings, {
            scopeSelector,
            source,
            priority: this.priorityForSource(source)
          });
        }

        const configIsReady =
          source === this.mainSource && this.settingsLoaded;
        if (configIsReady) {
          return this.requestSave();
        }
      }
    } else {
      this.scopedSettingsStore.removePropertiesForSourceAndSelector(
        source,
        scopeSelector
      );
      return this.emitChangeEvent();
    }
  } else {
    for (scopeSelector in this.scopedSettingsStore.propertiesForSource(
      source
    )) {
      this.unset(keyPath, { scopeSelector, source });
    }
    if (keyPath != null && source === this.mainSource) {
      return this.set(
        keyPath,
        getValueAtKeyPath(this.defaultSettings, keyPath)
      );
    }
  }
}
