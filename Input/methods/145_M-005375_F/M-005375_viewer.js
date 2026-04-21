open() {
  if (!this.opened) {
    this.opened = true;
    this.toggleButton.classList.add("toggled");
    this.toggleButton.setAttribute("aria-expanded", "true");
    this.bar.classList.remove("hidden");
  }

  this.findField.select();
  this.findField.focus();

  this._adjustWidth();
}
