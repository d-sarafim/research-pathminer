resetSettingsForSchemaChange(source) {
  if (source == null) {
    source = this.mainSource;
  }
  return this.transact(() => {
    this.settings = this.makeValueConformToSchema(null, this.settings, {
      suppressException: true
    });
    const selectorsAndSettings = this.scopedSettingsStore.propertiesForSource(
      source
    );
    this.scopedSettingsStore.removePropertiesForSource(source);
    for (let scopeSelector in selectorsAndSettings) {
      let settings = selectorsAndSettings[scopeSelector];
      settings = this.makeValueConformToSchema(null, settings, {
        suppressException: true
      });
      this.setRawScopedValue(null, settings, source, scopeSelector);
    }
  });
}
