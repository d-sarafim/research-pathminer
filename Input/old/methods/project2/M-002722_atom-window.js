constructor(atomApplication, fileRecoveryService, settings = {}) {
  StartupTime.addMarker('main-process:atom-window:start');

  super();

  this.id = nextId++;
  this.atomApplication = atomApplication;
  this.fileRecoveryService = fileRecoveryService;
  this.isSpec = settings.isSpec;
  this.headless = settings.headless;
  this.safeMode = settings.safeMode;
  this.devMode = settings.devMode;
  this.resourcePath = settings.resourcePath;

  const locationsToOpen = settings.locationsToOpen || [];

  this.loadedPromise = new Promise(resolve => {
    this.resolveLoadedPromise = resolve;
  });
  this.closedPromise = new Promise(resolve => {
    this.resolveClosedPromise = resolve;
  });

  const options = {
    show: false,
    title: getAppName(),
    tabbingIdentifier: 'atom',
    webPreferences: {
      // Prevent specs from throttling when the window is in the background:
      // this should result in faster CI builds, and an improvement in the
      // local development experience when running specs through the UI (which
      // now won't pause when e.g. minimizing the window).
      backgroundThrottling: !this.isSpec,
      // Disable the `auxclick` feature so that `click` events are triggered in
      // response to a middle-click.
      // (Ref: https://github.com/atom/atom/pull/12696#issuecomment-290496960)
      disableBlinkFeatures: 'Auxclick',
      nodeIntegration: true,
      webviewTag: true,

      // TodoElectronIssue: remote module is deprecated https://www.electronjs.org/docs/breaking-changes#default-changed-enableremotemodule-defaults-to-false
      enableRemoteModule: true,
      // node support in threads
      nodeIntegrationInWorker: true
    },
    simpleFullscreen: this.getSimpleFullscreen()
  };

  // Don't set icon on Windows so the exe's ico will be used as window and
  // taskbar's icon. See https://github.com/atom/atom/issues/4811 for more.
  if (process.platform === 'linux')
    options.icon = nativeImage.createFromPath(ICON_PATH);
  if (this.shouldAddCustomTitleBar()) options.titleBarStyle = 'hidden';
  if (this.shouldAddCustomInsetTitleBar())
    options.titleBarStyle = 'hiddenInset';
  if (this.shouldHideTitleBar()) options.frame = false;

  const BrowserWindowConstructor =
    settings.browserWindowConstructor || BrowserWindow;
  this.browserWindow = new BrowserWindowConstructor(options);

  Object.defineProperty(this.browserWindow, 'loadSettingsJSON', {
    get: () =>
      JSON.stringify(
        Object.assign(
          {
            userSettings: !this.isSpec
              ? this.atomApplication.configFile.get()
              : null
          },
          this.loadSettings
        )
      )
  });

  this.handleEvents();

  this.loadSettings = Object.assign({}, settings);
  this.loadSettings.appVersion = app.getVersion();
  this.loadSettings.appName = getAppName();
  this.loadSettings.resourcePath = this.resourcePath;
  this.loadSettings.atomHome = process.env.ATOM_HOME;
  if (this.loadSettings.devMode == null) this.loadSettings.devMode = false;
  if (this.loadSettings.safeMode == null) this.loadSettings.safeMode = false;
  if (this.loadSettings.clearWindowState == null)
    this.loadSettings.clearWindowState = false;

  this.addLocationsToOpen(locationsToOpen);

  this.loadSettings.hasOpenFiles = locationsToOpen.some(
    location => location.pathToOpen && !location.isDirectory
  );
  this.loadSettings.initialProjectRoots = this.projectRoots;

  StartupTime.addMarker('main-process:atom-window:end');

  // Expose the startup markers to the renderer process, so we can have unified
  // measures about startup time between the main process and the renderer process.
  Object.defineProperty(this.browserWindow, 'startupMarkers', {
    get: () => {
      // We only want to make the main process startup data available once,
      // so if the window is refreshed or a new window is opened, the
      // renderer process won't use it again.
      const timingData = StartupTime.exportData();
      StartupTime.deleteData();

      return timingData;
    }
  });

  // Only send to the first non-spec window created
  if (includeShellLoadTime && !this.isSpec) {
    includeShellLoadTime = false;
    if (!this.loadSettings.shellLoadTime) {
      this.loadSettings.shellLoadTime = Date.now() - global.shellStartTime;
    }
  }

  if (!this.loadSettings.env) this.env = this.loadSettings.env;

  this.browserWindow.on('window:loaded', () => {
    this.disableZoom();
    this.emit('window:loaded');
    this.resolveLoadedPromise();
  });

  this.browserWindow.on('window:locations-opened', () => {
    this.emit('window:locations-opened');
  });

  this.browserWindow.on('enter-full-screen', () => {
    this.browserWindow.webContents.send('did-enter-full-screen');
  });

  this.browserWindow.on('leave-full-screen', () => {
    this.browserWindow.webContents.send('did-leave-full-screen');
  });

  this.browserWindow.loadURL(
    url.format({
      protocol: 'file',
      pathname: `${this.resourcePath}/static/index.html`,
      slashes: true
    })
  );

  this.browserWindow.showSaveDialog = this.showSaveDialog.bind(this);

  if (this.isSpec) this.browserWindow.focusOnWebView();

  const hasPathToOpen = !(
    locationsToOpen.length === 1 && locationsToOpen[0].pathToOpen == null
  );
  if (hasPathToOpen && !this.isSpecWindow())
    this.openLocations(locationsToOpen);
}
