async rebuildIncompatiblePackages() {
  this.rebuildInProgress = true;
  let rebuiltPackageCount = 0;
  for (let pack of this.incompatiblePackages) {
    this.setPackageStatus(pack, REBUILDING);
    let { code, stderr } = await pack.rebuild();
    if (code === 0) {
      this.setPackageStatus(pack, REBUILD_SUCCEEDED);
      rebuiltPackageCount++;
    } else {
      this.setRebuildFailureOutput(pack, stderr);
      this.setPackageStatus(pack, REBUILD_FAILED);
    }
  }
  this.rebuildInProgress = false;
  this.rebuiltPackageCount = rebuiltPackageCount;
  etch.update(this);
}
