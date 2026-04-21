constructor(options, eventBus, l10n) {
  this.toolbar = options.container;
  this.eventBus = eventBus;
  this.l10n = l10n;
  this.buttons = [{
    element: options.previous,
    eventName: "previouspage"
  }, {
    element: options.next,
    eventName: "nextpage"
  }, {
    element: options.zoomIn,
    eventName: "zoomin"
  }, {
    element: options.zoomOut,
    eventName: "zoomout"
  }, {
    element: options.openFile,
    eventName: "openfile"
  }, {
    element: options.print,
    eventName: "print"
  }, {
    element: options.presentationModeButton,
    eventName: "presentationmode"
  }, {
    element: options.download,
    eventName: "download"
  }, {
    element: options.viewBookmark,
    eventName: null
  }];
  this.items = {
    numPages: options.numPages,
    pageNumber: options.pageNumber,
    scaleSelectContainer: options.scaleSelectContainer,
    scaleSelect: options.scaleSelect,
    customScaleOption: options.customScaleOption,
    previous: options.previous,
    next: options.next,
    zoomIn: options.zoomIn,
    zoomOut: options.zoomOut
  };
  this._wasLocalized = false;
  this.reset();

  this._bindListeners();
}
