_popState({
  state
}) {
  const newHash = getCurrentHash(),
        hashChanged = this._currentHash !== newHash;
  this._currentHash = newHash;

  if (!state) {
    this._uid++;

    const {
      hash,
      page,
      rotation
    } = this._parseCurrentHash();

    this._pushOrReplaceState({
      hash,
      page,
      rotation
    }, true);

    return;
  }

  if (!this._isValidState(state)) {
    return;
  }

  this._popStateInProgress = true;

  if (hashChanged) {
    this._blockHashChange++;
    (0, _ui_utils.waitOnEventOrTimeout)({
      target: window,
      name: "hashchange",
      delay: HASH_CHANGE_TIMEOUT
    }).then(() => {
      this._blockHashChange--;
    });
  }

  const destination = state.destination;

  this._updateInternalState(destination, state.uid, true);

  if ((0, _ui_utils.isValidRotation)(destination.rotation)) {
    this.linkService.rotation = destination.rotation;
  }

  if (destination.dest) {
    this.linkService.goToDestination(destination.dest);
  } else if (destination.hash) {
    this.linkService.setHash(destination.hash);
  } else if (destination.page) {
    this.linkService.page = destination.page;
  }

  Promise.resolve().then(() => {
    this._popStateInProgress = false;
  });
}
