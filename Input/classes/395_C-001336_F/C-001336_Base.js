export default class Base {
  constructor(opts) {
    this.opts = opts
  }

  init() {
    const config = new Config(this.opts).init({ responsiveOverride: false })
    const globals = new Globals().init(config)

    const w = {
      config,
      globals
    }

    return w
  }
}
