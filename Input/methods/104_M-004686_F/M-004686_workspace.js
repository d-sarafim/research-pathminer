observeActivePane(callback) {
  callback(this.getActivePane());
  return this.onDidChangeActivePane(callback);
}
