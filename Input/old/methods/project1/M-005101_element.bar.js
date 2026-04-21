constructor(cfg) {
  super();

  this.options = undefined;
  this.horizontal = undefined;
  this.base = undefined;
  this.width = undefined;
  this.height = undefined;
  this.inflateAmount = undefined;

  if (cfg) {
    Object.assign(this, cfg);
  }
}
