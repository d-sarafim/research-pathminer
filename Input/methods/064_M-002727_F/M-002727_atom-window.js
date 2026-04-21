handleEvents() {
  this.browserWindow.on('close', async event => {
    if (
      (!this.atomApplication.quitting ||
        this.atomApplication.quittingForUpdate) &&
      !this.unloading
    ) {
      event.preventDefault();
      this.unloading = true;
      this.atomApplication.saveCurrentWindowOptions(false);
      if (await this.prepareToUnload()) this.close();
    }
  });

  this.browserWindow.on('closed', () => {
    this.fileRecoveryService.didCloseWindow(this);
    this.atomApplication.removeWindow(this);
    this.resolveClosedPromise();
  });

  this.browserWindow.on('unresponsive', async () => {
    if (this.isSpec) return;
    const result = await dialog.showMessageBox(this.browserWindow, {
      type: 'warning',
      buttons: ['Force Close', 'Keep Waiting'],
      cancelId: 1, // Canceling should be the least destructive action
      message: 'Editor is not responding',
      detail:
        'The editor is not responding. Would you like to force close it or just keep waiting?'
    });
    if (result.response === 0) this.browserWindow.destroy();
  });

  this.browserWindow.webContents.on('render-process-gone', async () => {
    if (this.headless) {
      console.log('Renderer process crashed, exiting');
      this.atomApplication.exit(100);
      return;
    }

    await this.fileRecoveryService.didCrashWindow(this);

    const result = await dialog.showMessageBox(this.browserWindow, {
      type: 'warning',
      buttons: ['Close Window', 'Reload', 'Keep It Open'],
      cancelId: 2, // Canceling should be the least destructive action
      message: 'The editor has crashed',
      detail: 'Please report this issue to https://github.com/atom/atom'
    });

    switch (result.response) {
      case 0:
        this.browserWindow.destroy();
        break;
      case 1:
        this.browserWindow.reload();
        break;
    }
  });

  this.browserWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== this.browserWindow.webContents.getURL())
      event.preventDefault();
  });

  this.setupContextMenu();

  // Spec window's web view should always have focus
  if (this.isSpec)
    this.browserWindow.on('blur', () => this.browserWindow.focusOnWebView());
}
