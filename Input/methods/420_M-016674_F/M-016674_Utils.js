static isIE11() {
  if (
    window.navigator.userAgent.indexOf('MSIE') !== -1 ||
    window.navigator.appVersion.indexOf('Trident/') > -1
  ) {
    return true
  }
}
