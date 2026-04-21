class PathWatcherManager {
  // Private: Access the currently active manager instance, creating one if necessary.
  static active() {
    if (!this.activeManager) {
      this.activeManager = new PathWatcherManager(
        atom.config.get('core.fileSystemWatcher')
      );
      this.sub = atom.config.onDidChange(
        'core.fileSystemWatcher',
        ({ newValue }) => {
          this.transitionTo(newValue);
        }
      );
    }
    return this.activeManager;
  }

  // Private: Replace the active {PathWatcherManager} with a new one that creates [NativeWatchers]{NativeWatcher}
  // based on the value of `setting`.
  static async transitionTo(setting) {
    const current = this.active();

    if (this.transitionPromise) {
      await this.transitionPromise;
    }

    if (current.setting === setting) {
      return;
    }
    current.isShuttingDown = true;

    let resolveTransitionPromise = () => {};
    this.transitionPromise = new Promise(resolve => {
      resolveTransitionPromise = resolve;
    });

    const replacement = new PathWatcherManager(setting);
    this.activeManager = replacement;

    await Promise.all(
      Array.from(current.live, async ([root, native]) => {
        const w = await replacement.createWatcher(root, {}, () => {});
        native.reattachTo(w.native, root, w.native.options || {});
      })
    );

    current.stopAllWatchers();

    resolveTransitionPromise();
    this.transitionPromise = null;
  }

  // Private: Initialize global {PathWatcher} state.
  constructor(setting) {
    this.setting = setting;
    this.live = new Map();

    const initLocal = NativeConstructor => {
      this.nativeRegistry = new NativeWatcherRegistry(normalizedPath => {
        const nativeWatcher = new NativeConstructor(normalizedPath);

        this.live.set(normalizedPath, nativeWatcher);
        const sub = nativeWatcher.onWillStop(() => {
          this.live.delete(normalizedPath);
          sub.dispose();
        });

        return nativeWatcher;
      });
    };

    if (setting === 'atom') {
      initLocal(AtomNativeWatcher);
    } else if (setting === 'experimental') {
      //
    } else if (setting === 'poll') {
      //
    } else {
      initLocal(NSFWNativeWatcher);
    }

    this.isShuttingDown = false;
  }

  useExperimentalWatcher() {
    return this.setting === 'experimental' || this.setting === 'poll';
  }

  // Private: Create a {PathWatcher} tied to this global state. See {watchPath} for detailed arguments.
  async createWatcher(rootPath, options, eventCallback) {
    if (this.isShuttingDown) {
      await this.constructor.transitionPromise;
      return PathWatcherManager.active().createWatcher(
        rootPath,
        options,
        eventCallback
      );
    }

    if (this.useExperimentalWatcher()) {
      if (this.setting === 'poll') {
        options.poll = true;
      }

      const w = await watcher.watchPath(rootPath, options, eventCallback);
      this.live.set(rootPath, w.native);
      return w;
    }

    const w = new PathWatcher(this.nativeRegistry, rootPath, options);
    w.onDidChange(eventCallback);
    await w.getStartPromise();
    return w;
  }

  // Private: Directly access the {NativeWatcherRegistry}.
  getRegistry() {
    if (this.useExperimentalWatcher()) {
      return watcher.getRegistry();
    }

    return this.nativeRegistry;
  }

  // Private: Sample watcher usage statistics. Only available for experimental watchers.
  status() {
    if (this.useExperimentalWatcher()) {
      return watcher.status();
    }

    return {};
  }

  // Private: Return a {String} depicting the currently active native watchers.
  print() {
    if (this.useExperimentalWatcher()) {
      return watcher.printWatchers();
    }

    return this.nativeRegistry.print();
  }

  // Private: Stop all living watchers.
  //
  // Returns a {Promise} that resolves when all native watcher resources are disposed.
  stopAllWatchers() {
    if (this.useExperimentalWatcher()) {
      return watcher.stopAllWatchers();
    }

    return Promise.all(Array.from(this.live, ([, w]) => w.stop()));
  }
}
