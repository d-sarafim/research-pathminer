destroy() {
  this.notifyPlugins('beforeDestroy');
  const {canvas, ctx} = this;

  this._stop();
  this.config.clearCache();

  if (canvas) {
    this.unbindEvents();
    clearCanvas(canvas, ctx);
    this.platform.releaseContext(ctx);
    this.canvas = null;
    this.ctx = null;
  }

  delete instances[this.id];

  this.notifyPlugins('afterDestroy');
}
