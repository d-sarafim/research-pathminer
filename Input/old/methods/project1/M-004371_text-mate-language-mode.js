foldEndRegexForScopeDescriptor(scope) {
  return this.regexForPattern(
    this.config.get('editor.foldEndPattern', { scope })
  );
}
