handleToggle_() {
  this.element.classList.toggle(CLASS_COLLAPSED);
  if (this.collapsed_) {
    replaceNode(this.collapseLabel_, this.label_);
  } else {
    replaceNode(this.label_, this.collapseLabel_);
  }
  this.collapsed_ = !this.collapsed_;

  // manage overview map if it had not been rendered before and control
  // is expanded
  const ovmap = this.ovmap_;
  if (!this.collapsed_) {
    if (ovmap.isRendered()) {
      this.viewExtent_ = undefined;
      ovmap.render();
      return;
    }
    ovmap.updateSize();
    this.resetExtent_();
    this.updateBoxAfterOvmapIsRendered_();
  }
}
