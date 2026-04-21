add(...deserializers) {
  for (let i = 0; i < deserializers.length; i++) {
    let deserializer = deserializers[i];
    this.deserializers[deserializer.name] = deserializer;
  }

  return new Disposable(() => {
    for (let j = 0; j < deserializers.length; j++) {
      let deserializer = deserializers[j];
      delete this.deserializers[deserializer.name];
    }
  });
}
