serialize() {
  return {
    deserializer: this.constructor.name,
    openSections: this.getOpenSections(),
    uri: this.getURI()
  };
}
