bindEvents() {
  this.bindUserEvents();
  if (this.options.responsive) {
    this.bindResponsiveEvents();
  } else {
    this.attached = true;
  }
}
