async getMultiple(properties) {
  await this._initializedPromise;
  const values = Object.create(null);

  for (const name in properties) {
    const val = this.file[name];
    values[name] = val !== undefined ? val : properties[name];
  }

  return values;
}
