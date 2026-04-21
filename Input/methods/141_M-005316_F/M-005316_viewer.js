constructor({
  container,
  eventBus,
  cursorToolOnLoad = CursorTool.SELECT
}) {
  this.container = container;
  this.eventBus = eventBus;
  this.active = CursorTool.SELECT;
  this.activeBeforePresentationMode = null;
  this.handTool = new _grab_to_pan.GrabToPan({
    element: this.container
  });

  this._addEventListeners();

  Promise.resolve().then(() => {
    this.switchTool(cursorToolOnLoad);
  });
}
