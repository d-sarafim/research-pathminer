class PathWatcher {
  // Private: Instantiate a new PathWatcher. Call {watchPath} instead.
  //
  // * `nativeWatcherRegistry` {NativeWatcherRegistry} used to find and consolidate redundant watchers.
  // * `watchedPath` {String} containing the absolute path to the root of the watched filesystem tree.
  // * `options` See {watchPath} for options.
  //
  constructor(nativeWatcherRegistry, watchedPath, options) {
    this.watchedPath = watchedPath;
    this.nativeWatcherRegistry = nativeWatcherRegistry;

    this.normalizedPath = null;
    this.native = null;
    this.changeCallbacks = new Map();

    this.attachedPromise = new Promise(resolve => {
      this.resolveAttachedPromise = resolve;
    });

    this.startPromise = new Promise((resolve, reject) => {
      this.resolveStartPromise = resolve;
      this.rejectStartPromise = reject;
    });

    this.normalizedPathPromise = new Promise((resolve, reject) => {
      fs.realpath(watchedPath, (err, real) => {
        if (err) {
          reject(err);
          return;
        }

        this.normalizedPath = real;
        resolve(real);
      });
    });
    this.normalizedPathPromise.catch(err => this.rejectStartPromise(err));

    this.emitter = new Emitter();
    this.subs = new CompositeDisposable();
  }

  // Private: Return a {Promise} that will resolve with the normalized root path.
  getNormalizedPathPromise() {
    return this.normalizedPathPromise;
  }

  // Private: Return a {Promise} that will resolve the first time that this watcher is attached to a native watcher.
  getAttachedPromise() {
    return this.attachedPromise;
  }

  // Extended: Return a {Promise} that will resolve when the underlying native watcher is ready to begin sending events.
  // When testing filesystem watchers, it's important to await this promise before making filesystem changes that you
  // intend to assert about because there will be a delay between the instantiation of the watcher and the activation
  // of the underlying OS resources that feed its events.
  //
  // PathWatchers acquired through `watchPath` are already started.
  //
  // ```js
  // const {watchPath} = require('atom')
  // const ROOT = path.join(__dirname, 'fixtures')
  // const FILE = path.join(ROOT, 'filename.txt')
  //
  // describe('something', function () {
  //   it("doesn't miss events", async function () {
  //     const watcher = watchPath(ROOT, {}, events => {})
  //     await watcher.getStartPromise()
  //     fs.writeFile(FILE, 'contents\n', err => {
  //       // The watcher is listening and the event should be
  //       // received asynchronously
  //     }
  //   })
  // })
  // ```
  getStartPromise() {
    return this.startPromise;
  }

  // Private: Attach another {Function} to be called with each batch of filesystem events. See {watchPath} for the
  // spec of the callback's argument.
  //
  // * `callback` {Function} to be called with each batch of filesystem events.
  //
  // Returns a {Disposable} that will stop the underlying watcher when all callbacks mapped to it have been disposed.
  onDidChange(callback) {
    if (this.native) {
      const sub = this.native.onDidChange(events =>
        this.onNativeEvents(events, callback)
      );
      this.changeCallbacks.set(callback, sub);

      this.native.start();
    } else {
      // Attach to a new native listener and retry
      this.nativeWatcherRegistry.attach(this).then(() => {
        this.onDidChange(callback);
      });
    }

    return new Disposable(() => {
      const sub = this.changeCallbacks.get(callback);
      this.changeCallbacks.delete(callback);
      sub.dispose();
    });
  }

  // Extended: Invoke a {Function} when any errors related to this watcher are reported.
  //
  // * `callback` {Function} to be called when an error occurs.
  //   * `err` An {Error} describing the failure condition.
  //
  // Returns a {Disposable}.
  onDidError(callback) {
    return this.emitter.on('did-error', callback);
  }

  // Private: Wire this watcher to an operating system-level native watcher implementation.
  attachToNative(native) {
    this.subs.dispose();
    this.native = native;

    if (native.isRunning()) {
      this.resolveStartPromise();
    } else {
      this.subs.add(
        native.onDidStart(() => {
          this.resolveStartPromise();
        })
      );
    }

    // Transfer any native event subscriptions to the new NativeWatcher.
    for (const [callback, formerSub] of this.changeCallbacks) {
      const newSub = native.onDidChange(events =>
        this.onNativeEvents(events, callback)
      );
      this.changeCallbacks.set(callback, newSub);
      formerSub.dispose();
    }

    this.subs.add(
      native.onDidError(err => {
        this.emitter.emit('did-error', err);
      })
    );

    this.subs.add(
      native.onShouldDetach(({ replacement, watchedPath }) => {
        if (
          this.native === native &&
          replacement !== native &&
          this.normalizedPath.startsWith(watchedPath)
        ) {
          this.attachToNative(replacement);
        }
      })
    );

    this.subs.add(
      native.onWillStop(() => {
        if (this.native === native) {
          this.subs.dispose();
          this.native = null;
        }
      })
    );

    this.resolveAttachedPromise();
  }

  // Private: Invoked when the attached native watcher creates a batch of native filesystem events. The native watcher's
  // events may include events for paths above this watcher's root path, so filter them to only include the relevant
  // ones, then re-broadcast them to our subscribers.
  onNativeEvents(events, callback) {
    const isWatchedPath = eventPath =>
      eventPath.startsWith(this.normalizedPath);

    const filtered = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (event.action === 'renamed') {
        const srcWatched = isWatchedPath(event.oldPath);
        const destWatched = isWatchedPath(event.path);

        if (srcWatched && destWatched) {
          filtered.push(event);
        } else if (srcWatched && !destWatched) {
          filtered.push({
            action: 'deleted',
            kind: event.kind,
            path: event.oldPath
          });
        } else if (!srcWatched && destWatched) {
          filtered.push({
            action: 'created',
            kind: event.kind,
            path: event.path
          });
        }
      } else {
        if (isWatchedPath(event.path)) {
          filtered.push(event);
        }
      }
    }

    if (filtered.length > 0) {
      callback(filtered);
    }
  }

  // Extended: Unsubscribe all subscribers from filesystem events. Native resources will be released asynchronously,
  // but this watcher will stop broadcasting events immediately.
  dispose() {
    for (const sub of this.changeCallbacks.values()) {
      sub.dispose();
    }

    this.emitter.dispose();
    this.subs.dispose();
  }
}
