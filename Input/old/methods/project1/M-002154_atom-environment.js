unloadEditorWindow() {
  if (!this.project) return;

  this.storeWindowBackground();
  this.saveBlobStoreSync();
}
