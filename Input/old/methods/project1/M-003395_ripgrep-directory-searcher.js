prepareGlobs(globs, projectRootPath) {
  const output = [];

  for (let pattern of globs) {
    // we need to replace path separators by slashes since globs should
    // always use always slashes as path separators.
    pattern = pattern.replace(new RegExp(`\\${path.sep}`, 'g'), '/');

    if (pattern.length === 0) {
      continue;
    }

    const projectName = path.basename(projectRootPath);

    // The user can just search inside one of the opened projects. When we detect
    // this scenario we just consider the glob to include every file.
    if (pattern === projectName) {
      output.push('**/*');
      continue;
    }

    if (pattern.startsWith(projectName + '/')) {
      pattern = pattern.slice(projectName.length + 1);
    }

    if (pattern.endsWith('/')) {
      pattern = pattern.slice(0, -1);
    }

    output.push(pattern);
    output.push(pattern.endsWith('/**') ? pattern : `${pattern}/**`);
  }

  return output;
}
