getGrammar() {
  const languageMode = this.buffer.getLanguageMode();
  return (
    (languageMode.getGrammar && languageMode.getGrammar()) || NullGrammar
  );
}
