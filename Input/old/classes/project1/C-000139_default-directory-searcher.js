class DirectorySearch {
  constructor(rootPaths, regex, options) {
    const scanHandlerOptions = {
      ignoreCase: regex.ignoreCase,
      inclusions: options.inclusions,
      includeHidden: options.includeHidden,
      excludeVcsIgnores: options.excludeVcsIgnores,
      globalExclusions: options.exclusions,
      follow: options.follow
    };
    const searchOptions = {
      leadingContextLineCount: options.leadingContextLineCount,
      trailingContextLineCount: options.trailingContextLineCount
    };
    this.task = new Task(require.resolve('./scan-handler'));
    this.task.on('scan:result-found', options.didMatch);
    this.task.on('scan:file-error', options.didError);
    this.task.on('scan:paths-searched', options.didSearchPaths);
    this.promise = new Promise((resolve, reject) => {
      this.task.on('task:cancelled', reject);
      this.task.start(
        rootPaths,
        regex.source,
        scanHandlerOptions,
        searchOptions,
        () => {
          this.task.terminate();
          resolve();
        }
      );
    });
  }

  then(...args) {
    return this.promise.then.apply(this.promise, args);
  }

  cancel() {
    // This will cause @promise to reject.
    this.task.cancel();
  }
}
