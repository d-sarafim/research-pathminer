save(key, value) {
  return new Promise((resolve, reject) => {
    this.dbPromise.then(db => {
      if (db == null) return resolve();

      const request = db
        .transaction(['states'], 'readwrite')
        .objectStore('states')
        .put({ value: value, storedAt: new Date().toString() }, key);

      request.onsuccess = resolve;
      request.onerror = reject;
    });
  });
}
