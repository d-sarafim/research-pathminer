_sync(args) {
  if (this._parsing) {
    this._syncList.push(args);
  } else {
    const [method, arg1, arg2] = args;
    this[method](arg1, arg2);
  }
  this.chart._dataChanges.push([this.index, ...args]);
}
