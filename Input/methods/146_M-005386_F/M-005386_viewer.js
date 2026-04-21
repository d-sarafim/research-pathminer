executeCommand(cmd, state) {
  if (!state) {
    return;
  }

  const pdfDocument = this._pdfDocument;

  if (this._state === null || this._shouldDirtyMatch(cmd, state)) {
    this._dirtyMatch = true;
  }

  this._state = state;

  if (cmd !== "findhighlightallchange") {
    this._updateUIState(FindState.PENDING);
  }

  this._firstPageCapability.promise.then(() => {
    if (!this._pdfDocument || pdfDocument && this._pdfDocument !== pdfDocument) {
      return;
    }

    this._extractText();

    const findbarClosed = !this._highlightMatches;
    const pendingTimeout = !!this._findTimeout;

    if (this._findTimeout) {
      clearTimeout(this._findTimeout);
      this._findTimeout = null;
    }

    if (cmd === "find") {
      this._findTimeout = setTimeout(() => {
        this._nextMatch();

        this._findTimeout = null;
      }, FIND_TIMEOUT);
    } else if (this._dirtyMatch) {
      this._nextMatch();
    } else if (cmd === "findagain") {
      this._nextMatch();

      if (findbarClosed && this._state.highlightAll) {
        this._updateAllPages();
      }
    } else if (cmd === "findhighlightallchange") {
      if (pendingTimeout) {
        this._nextMatch();
      } else {
        this._highlightMatches = true;
      }

      this._updateAllPages();
    } else {
      this._nextMatch();
    }
  });
}
