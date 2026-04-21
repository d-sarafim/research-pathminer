class WindowStack {
  constructor(windows = []) {
    this.addWindow = this.addWindow.bind(this);
    this.touch = this.touch.bind(this);
    this.removeWindow = this.removeWindow.bind(this);
    this.getLastFocusedWindow = this.getLastFocusedWindow.bind(this);
    this.all = this.all.bind(this);
    this.windows = windows;
  }

  addWindow(window) {
    this.removeWindow(window);
    return this.windows.unshift(window);
  }

  touch(window) {
    return this.addWindow(window);
  }

  removeWindow(window) {
    const currentIndex = this.windows.indexOf(window);
    if (currentIndex > -1) {
      return this.windows.splice(currentIndex, 1);
    }
  }

  getLastFocusedWindow(predicate) {
    if (predicate == null) {
      predicate = win => true;
    }
    return this.windows.find(predicate);
  }

  all() {
    return this.windows;
  }
}
