setPackageStatus(pack, status) {
  this.rebuildStatuses.set(pack, status);
  etch.update(this);
}
