error(message) {
    message = "[ERROR]" + this._message(message);
    window.console.error(message);
    this.scene.fire("error", message);
}
