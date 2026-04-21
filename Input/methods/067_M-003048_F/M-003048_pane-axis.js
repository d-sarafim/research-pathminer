constructor({ orientation, children, flexScale }, viewRegistry) {
  super();
  this.parent = null;
  this.container = null;
  this.orientation = orientation;
  this.viewRegistry = viewRegistry;
  this.emitter = new Emitter();
  this.subscriptionsByChild = new WeakMap();
  this.subscriptions = new CompositeDisposable();
  this.flexScale = flexScale != null ? flexScale : 1;
  this.children = [];
  if (children) {
    for (let child of children) {
      this.addChild(child);
    }
  }
}
