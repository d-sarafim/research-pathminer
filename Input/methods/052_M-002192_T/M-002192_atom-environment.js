async openLocations(locations) {
  const needsProjectPaths =
    this.project && this.project.getPaths().length === 0;
  const foldersToAddToProject = new Set();
  const fileLocationsToOpen = [];
  const missingFolders = [];

  // Asynchronously fetch stat information about each requested path to open.
  const locationStats = await Promise.all(
    locations.map(async location => {
      const stats = location.pathToOpen
        ? await stat(location.pathToOpen).catch(() => null)
        : null;
      return { location, stats };
    })
  );

  for (const { location, stats } of locationStats) {
    const { pathToOpen } = location;
    if (!pathToOpen) {
      // Untitled buffer
      fileLocationsToOpen.push(location);
      continue;
    }

    if (stats !== null) {
      // Path exists
      if (stats.isDirectory()) {
        // Directory: add as a project folder
        foldersToAddToProject.add(
          this.project.getDirectoryForProjectPath(pathToOpen).getPath()
        );
      } else if (stats.isFile()) {
        if (location.isDirectory) {
          // File: no longer a directory
          missingFolders.push(location);
        } else {
          // File: add as a file location
          fileLocationsToOpen.push(location);
        }
      }
    } else {
      // Path does not exist
      // Attempt to interpret as a URI from a non-default directory provider
      const directory = this.project.getProvidedDirectoryForProjectPath(
        pathToOpen
      );
      if (directory) {
        // Found: add as a project folder
        foldersToAddToProject.add(directory.getPath());
      } else if (location.isDirectory) {
        // Not found and must be a directory: add to missing list and use to derive state key
        missingFolders.push(location);
      } else {
        // Not found: open as a new file
        fileLocationsToOpen.push(location);
      }
    }

    if (location.hasWaitSession) this.pathsWithWaitSessions.add(pathToOpen);
  }

  let restoredState = false;
  if (foldersToAddToProject.size > 0 || missingFolders.length > 0) {
    // Include missing folders in the state key so that sessions restored with no-longer-present project root folders
    // don't lose data.
    const foldersForStateKey = Array.from(foldersToAddToProject).concat(
      missingFolders.map(location => location.pathToOpen)
    );
    const state = await this.loadState(
      this.getStateKey(Array.from(foldersForStateKey))
    );

    // only restore state if this is the first path added to the project
    if (state && needsProjectPaths) {
      const files = fileLocationsToOpen.map(location => location.pathToOpen);
      await this.attemptRestoreProjectStateForPaths(
        state,
        Array.from(foldersToAddToProject),
        files
      );
      restoredState = true;
    } else {
      for (let folder of foldersToAddToProject) {
        this.project.addPath(folder);
      }
    }
  }

  if (!restoredState) {
    const fileOpenPromises = [];
    for (const {
      pathToOpen,
      initialLine,
      initialColumn
    } of fileLocationsToOpen) {
      fileOpenPromises.push(
        this.workspace &&
          this.workspace.open(pathToOpen, { initialLine, initialColumn })
      );
    }
    await Promise.all(fileOpenPromises);
  }

  if (missingFolders.length > 0) {
    let message = 'Unable to open project folder';
    if (missingFolders.length > 1) {
      message += 's';
    }

    let description = 'The ';
    if (missingFolders.length === 1) {
      description += 'directory `';
      description += missingFolders[0].pathToOpen;
      description += '` does not exist.';
    } else if (missingFolders.length === 2) {
      description += `directories \`${missingFolders[0].pathToOpen}\` `;
      description += `and \`${missingFolders[1].pathToOpen}\` do not exist.`;
    } else {
      description += 'directories ';
      description += missingFolders
        .slice(0, -1)
        .map(location => location.pathToOpen)
        .map(pathToOpen => '`' + pathToOpen + '`, ')
        .join('');
      description +=
        'and `' +
        missingFolders[missingFolders.length - 1].pathToOpen +
        '` do not exist.';
    }

    this.notifications.addWarning(message, { description });
  }

  ipcRenderer.send('window-command', 'window:locations-opened');
}
