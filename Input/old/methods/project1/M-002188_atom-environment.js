setAutoHideMenuBar(autoHide) {
  this.applicationDelegate.setAutoHideWindowMenuBar(autoHide);
  this.applicationDelegate.setWindowMenuBarVisibility(!autoHide);
}
