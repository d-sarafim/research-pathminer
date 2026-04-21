constructor(sandboxBundleSrc) {
  this._ready = (0, _pdfjsLib.loadScript)(sandboxBundleSrc, true).then(() => {
    return window.pdfjsSandbox.QuickJSSandbox();
  });
}
