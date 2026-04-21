export default class BasicPlatform extends BasePlatform {
  acquireContext(item) {
    // To prevent canvas fingerprinting, some add-ons undefine the getContext
    // method, for example: https://github.com/kkapsner/CanvasBlocker
    // https://github.com/chartjs/Chart.js/issues/2807
    return item && item.getContext && item.getContext('2d') || null;
  }
  updateConfig(config) {
    config.options.animation = false;
  }
}
