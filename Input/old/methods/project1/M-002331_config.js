observeScopedKeyPath(scope, keyPath, callback) {
  callback(this.get(keyPath, { scope }));
  return this.onDidChangeScopedKeyPath(scope, keyPath, event =>
    callback(event.newValue)
  );
}
