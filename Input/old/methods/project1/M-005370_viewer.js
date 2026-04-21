constructor(options, eventBus, l10n) {
  this.opened = false;
  this.bar = options.bar;
  this.toggleButton = options.toggleButton;
  this.findField = options.findField;
  this.highlightAll = options.highlightAllCheckbox;
  this.caseSensitive = options.caseSensitiveCheckbox;
  this.entireWord = options.entireWordCheckbox;
  this.findMsg = options.findMsg;
  this.findResultsCount = options.findResultsCount;
  this.findPreviousButton = options.findPreviousButton;
  this.findNextButton = options.findNextButton;
  this.eventBus = eventBus;
  this.l10n = l10n;
  this.toggleButton.addEventListener("click", () => {
    this.toggle();
  });
  this.findField.addEventListener("input", () => {
    this.dispatchEvent("");
  });
  this.bar.addEventListener("keydown", e => {
    switch (e.keyCode) {
      case 13:
        if (e.target === this.findField) {
          this.dispatchEvent("again", e.shiftKey);
        }

        break;

      case 27:
        this.close();
        break;
    }
  });
  this.findPreviousButton.addEventListener("click", () => {
    this.dispatchEvent("again", true);
  });
  this.findNextButton.addEventListener("click", () => {
    this.dispatchEvent("again", false);
  });
  this.highlightAll.addEventListener("click", () => {
    this.dispatchEvent("highlightallchange");
  });
  this.caseSensitive.addEventListener("click", () => {
    this.dispatchEvent("casesensitivitychange");
  });
  this.entireWord.addEventListener("click", () => {
    this.dispatchEvent("entirewordchange");
  });

  this.eventBus._on("resize", this._adjustWidth.bind(this));
}
