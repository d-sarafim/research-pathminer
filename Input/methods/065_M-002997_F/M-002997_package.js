getStylesheetPaths() {
  if (
    this.bundledPackage &&
    this.packageManager.packagesCache[this.name] &&
    this.packageManager.packagesCache[this.name].styleSheetPaths
  ) {
    const { styleSheetPaths } = this.packageManager.packagesCache[this.name];
    return styleSheetPaths.map(styleSheetPath =>
      path.join(this.path, styleSheetPath)
    );
  } else {
    let indexStylesheet;
    const stylesheetDirPath = this.getStylesheetsPath();
    if (this.metadata.mainStyleSheet) {
      return [fs.resolve(this.path, this.metadata.mainStyleSheet)];
    } else if (this.metadata.styleSheets) {
      return this.metadata.styleSheets.map(name =>
        fs.resolve(stylesheetDirPath, name, ['css', 'less', ''])
      );
    } else if (
      (indexStylesheet = fs.resolve(this.path, 'index', ['css', 'less']))
    ) {
      return [indexStylesheet];
    } else {
      return fs.listSync(stylesheetDirPath, ['css', 'less']);
    }
  }
}
