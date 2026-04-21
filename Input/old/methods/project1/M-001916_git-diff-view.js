scheduleUpdate() {
  // Use Chromium native requestAnimationFrame because it yields
  // to the browser, is standard and doesn't involve extra JS overhead.
  if (this._animationId) cancelAnimationFrame(this._animationId);

  this._animationId = requestAnimationFrame(this.updateDiffs);
}
