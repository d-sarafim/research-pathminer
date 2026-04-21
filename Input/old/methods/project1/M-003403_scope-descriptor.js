isEqual(other) {
  if (this.scopes.length !== other.scopes.length) {
    return false;
  }
  for (let i = 0; i < this.scopes.length; i++) {
    const scope = this.scopes[i];
    if (scope !== other.scopes[i]) {
      return false;
    }
  }
  return true;
}
