constructor(packageManager) {
  this.rebuildStatuses = new Map();
  this.rebuildFailureOutputs = new Map();
  this.rebuildInProgress = false;
  this.rebuiltPackageCount = 0;
  this.packageManager = packageManager;
  this.loaded = false;
  etch.initialize(this);

  if (this.packageManager.getActivePackages().length > 0) {
    this.populateIncompatiblePackages();
  } else {
    global.setImmediate(this.populateIncompatiblePackages.bind(this));
  }

  this.element.addEventListener('click', event => {
    if (event.target === this.refs.rebuildButton) {
      this.rebuildIncompatiblePackages();
    } else if (event.target === this.refs.reloadButton) {
      atom.reload();
    } else if (event.target.classList.contains('view-settings')) {
      atom.workspace.open(
        `atom://config/packages/${event.target.package.name}`
      );
    }
  });
}
