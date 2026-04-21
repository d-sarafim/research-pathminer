class GenericExternalServices extends _app.DefaultExternalServices {
  static createDownloadManager(options) {
    return new _download_manager.DownloadManager();
  }

  static createPreferences() {
    return new GenericPreferences();
  }

  static createL10n({
    locale = "en-US"
  }) {
    return new _genericl10n.GenericL10n(locale);
  }

  static createScripting({
    sandboxBundleSrc
  }) {
    return new _generic_scripting.GenericScripting(sandboxBundleSrc);
  }

}
