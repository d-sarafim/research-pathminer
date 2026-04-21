update(value) {
  return new Promise(resolve => {
    this.requestSave(value);
    this.reloadCallbacks.push(resolve);
  });
}
