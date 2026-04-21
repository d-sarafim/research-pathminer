async openPaths({
  pathsToOpen,
  foldersToOpen,
  executedFrom,
  pidToKillWhenClosed,
  newWindow,
  devMode,
  safeMode,
  windowDimensions,
  profileStartup,
  window,
  clearWindowState,
  addToLastWindow,
  env
} = {}) {
  if (!env) env = process.env;
  if (!pathsToOpen) pathsToOpen = [];
  if (!foldersToOpen) foldersToOpen = [];

  devMode = Boolean(devMode);
  safeMode = Boolean(safeMode);
  clearWindowState = Boolean(clearWindowState);

  const locationsToOpen = await Promise.all(
    pathsToOpen.map(pathToOpen =>
      this.parsePathToOpen(pathToOpen, executedFrom, {
        hasWaitSession: pidToKillWhenClosed != null
      })
    )
  );

  for (const folderToOpen of foldersToOpen) {
    locationsToOpen.push({
      pathToOpen: folderToOpen,
      initialLine: null,
      initialColumn: null,
      exists: true,
      isDirectory: true,
      hasWaitSession: pidToKillWhenClosed != null
    });
  }

  if (locationsToOpen.length === 0) {
    return;
  }

  const hasNonEmptyPath = locationsToOpen.some(
    location => location.pathToOpen
  );
  const createNewWindow = newWindow || !hasNonEmptyPath;

  let existingWindow;

  if (!createNewWindow) {
    // An explicitly provided AtomWindow has precedence.
    existingWindow = window;

    // If no window is specified and at least one path is provided, locate an existing window that contains all
    // provided paths.
    if (!existingWindow && hasNonEmptyPath) {
      existingWindow = this.windowForLocations(
        locationsToOpen,
        devMode,
        safeMode
      );
    }

    // No window specified, no existing window found, and addition to the last window requested. Find the last
    // focused window that matches the requested dev and safe modes.
    if (!existingWindow && addToLastWindow) {
      existingWindow = this.getLastFocusedWindow(win => {
        return (
          !win.isSpec && win.devMode === devMode && win.safeMode === safeMode
        );
      });
    }

    // Fall back to the last focused window that has no project roots.
    if (!existingWindow) {
      existingWindow = this.getLastFocusedWindow(
        win => !win.isSpec && !win.hasProjectPaths()
      );
    }

    // One last case: if *no* paths are directories, add to the last focused window.
    if (!existingWindow) {
      const noDirectories = locationsToOpen.every(
        location => !location.isDirectory
      );
      if (noDirectories) {
        existingWindow = this.getLastFocusedWindow(win => {
          return (
            !win.isSpec &&
            win.devMode === devMode &&
            win.safeMode === safeMode
          );
        });
      }
    }
  }

  let openedWindow;
  if (existingWindow) {
    openedWindow = existingWindow;
    StartupTime.addMarker('main-process:atom-application:open-in-existing');
    openedWindow.openLocations(locationsToOpen);
    if (openedWindow.isMinimized()) {
      openedWindow.restore();
    } else {
      openedWindow.focus();
    }
    openedWindow.replaceEnvironment(env);
  } else {
    let resourcePath, windowInitializationScript;
    if (devMode) {
      try {
        windowInitializationScript = require.resolve(
          path.join(
            this.devResourcePath,
            'src',
            'initialize-application-window'
          )
        );
        resourcePath = this.devResourcePath;
      } catch (error) {}
    }

    if (!windowInitializationScript) {
      windowInitializationScript = require.resolve(
        '../initialize-application-window'
      );
    }
    if (!resourcePath) resourcePath = this.resourcePath;
    if (!windowDimensions)
      windowDimensions = this.getDimensionsForNewWindow();

    StartupTime.addMarker('main-process:atom-application:create-window');
    openedWindow = this.createWindow({
      locationsToOpen,
      windowInitializationScript,
      resourcePath,
      devMode,
      safeMode,
      windowDimensions,
      profileStartup,
      clearWindowState,
      env
    });
    this.addWindow(openedWindow);
    openedWindow.focus();
  }

  if (pidToKillWhenClosed != null) {
    if (!this.waitSessionsByWindow.has(openedWindow)) {
      this.waitSessionsByWindow.set(openedWindow, []);
    }
    this.waitSessionsByWindow.get(openedWindow).push({
      pid: pidToKillWhenClosed,
      remainingPaths: new Set(
        locationsToOpen.map(location => location.pathToOpen).filter(Boolean)
      )
    });
  }

  openedWindow.browserWindow.once('closed', () =>
    this.killProcessesForWindow(openedWindow)
  );
  return openedWindow;
}
