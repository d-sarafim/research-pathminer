observe(callback) {
  this.editors.forEach(callback);
  return this.emitter.on('did-add-editor', callback);
}
