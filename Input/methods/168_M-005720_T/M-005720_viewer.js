constructor(fingerprint, cacheSize = DEFAULT_VIEW_HISTORY_CACHE_SIZE) {
  this.fingerprint = fingerprint;
  this.cacheSize = cacheSize;
  this._initializedPromise = this._readFromStorage().then(databaseStr => {
    const database = JSON.parse(databaseStr || "{}");
    let index = -1;

    if (!Array.isArray(database.files)) {
      database.files = [];
    } else {
      while (database.files.length >= this.cacheSize) {
        database.files.shift();
      }

      for (let i = 0, ii = database.files.length; i < ii; i++) {
        const branch = database.files[i];

        if (branch.fingerprint === this.fingerprint) {
          index = i;
          break;
        }
      }
    }

    if (index === -1) {
      index = database.files.push({
        fingerprint: this.fingerprint
      }) - 1;
    }

    this.file = database.files[index];
    this.database = database;
  });
}
