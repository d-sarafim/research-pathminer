constructor({ applicationDelegate }) {
  this.applicationDelegate = applicationDelegate;
  this.subscriptions = new CompositeDisposable();
  this.emitter = new Emitter();
}
