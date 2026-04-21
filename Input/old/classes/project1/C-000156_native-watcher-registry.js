class ParentResult {
  // Private: Instantiate a new {ParentResult}.
  //
  // * `parent` the {RegistryWatcherNode} that was discovered.
  // * `remainingPathSegments` an {Array} of the directories that lie between the leaf node's watched directory and
  //   the requested directory. This will be empty for exact matches.
  constructor(parent, remainingPathSegments) {
    this.parent = parent;
    this.remainingPathSegments = remainingPathSegments;
  }

  // Private: Dispatch within a map of callback actions.
  //
  // * `actions` {Object} containing a `parent` key that maps to a callback to be invoked when a parent of a requested
  //   requested directory is returned by a {RegistryNode.lookup} call. The callback will be called with the
  //   {RegistryWatcherNode} instance and an {Array} of the {String} path segments that separate the parent node
  //   and the requested directory.
  //
  // Returns: the result of the `actions` callback.
  when(actions) {
    return actions.parent(this.parent, this.remainingPathSegments);
  }
}
