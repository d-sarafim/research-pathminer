class ChildrenResult {
  // Private: Instantiate a new {ChildrenResult}.
  //
  // * `children` {Array} of the {RegistryWatcherNode} instances that were discovered.
  constructor(children) {
    this.children = children;
  }

  // Private: Dispatch within a map of callback actions.
  //
  // * `actions` {Object} containing a `children` key that maps to a callback to be invoked when a parent of a requested
  //   requested directory is returned by a {RegistryNode.lookup} call. The callback will be called with the
  //   {RegistryWatcherNode} instance.
  //
  // Returns: the result of the `actions` callback.
  when(actions) {
    return actions.children(this.children);
  }
}
