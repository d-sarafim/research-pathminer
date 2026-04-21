constructor(resourcePath, safeMode) {
  this.loadPaths = [];

  if (!safeMode) {
    this.loadPaths.push(path.join(process.env.ATOM_HOME, 'dev', 'packages'));
    this.loadPaths.push(path.join(resourcePath, 'packages'));
  }

  this.loadPaths.push(path.join(process.env.ATOM_HOME, 'packages'));
  this.loadPaths.push(path.join(resourcePath, 'node_modules'));

  this.registerAtomProtocol();
}
