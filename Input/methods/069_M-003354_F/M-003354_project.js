isPathModified(filePath) {
  const bufferForPath = this.findBufferForPath(this.resolvePath(filePath));
  return bufferForPath && bufferForPath.isModified();
}
