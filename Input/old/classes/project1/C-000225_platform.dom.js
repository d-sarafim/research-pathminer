export default class DomPlatform extends BasePlatform {

  /**
	 * @param {HTMLCanvasElement} canvas
	 * @param {number} [aspectRatio]
	 * @return {CanvasRenderingContext2D|null}
	 */
  acquireContext(canvas, aspectRatio) {
    // To prevent canvas fingerprinting, some add-ons undefine the getContext
    // method, for example: https://github.com/kkapsner/CanvasBlocker
    // https://github.com/chartjs/Chart.js/issues/2807
    const context = canvas && canvas.getContext && canvas.getContext('2d');

    // `instanceof HTMLCanvasElement/CanvasRenderingContext2D` fails when the canvas is
    // inside an iframe or when running in a protected environment. We could guess the
    // types from their toString() value but let's keep things flexible and assume it's
    // a sufficient condition if the canvas has a context2D which has canvas as `canvas`.
    // https://github.com/chartjs/Chart.js/issues/3887
    // https://github.com/chartjs/Chart.js/issues/4102
    // https://github.com/chartjs/Chart.js/issues/4152
    if (context && context.canvas === canvas) {
      // Load platform resources on first chart creation, to make it possible to
      // import the library before setting platform options.
      initCanvas(canvas, aspectRatio);
      return context;
    }

    return null;
  }

  /**
	 * @param {CanvasRenderingContext2D} context
	 */
  releaseContext(context) {
    const canvas = context.canvas;
    if (!canvas[EXPANDO_KEY]) {
      return false;
    }

    const initial = canvas[EXPANDO_KEY].initial;
    ['height', 'width'].forEach((prop) => {
      const value = initial[prop];
      if (isNullOrUndef(value)) {
        canvas.removeAttribute(prop);
      } else {
        canvas.setAttribute(prop, value);
      }
    });

    const style = initial.style || {};
    Object.keys(style).forEach((key) => {
      canvas.style[key] = style[key];
    });

    // The canvas render size might have been changed (and thus the state stack discarded),
    // we can't use save() and restore() to restore the initial state. So make sure that at
    // least the canvas context is reset to the default state by setting the canvas width.
    // https://www.w3.org/TR/2011/WD-html5-20110525/the-canvas-element.html
    // eslint-disable-next-line no-self-assign
    canvas.width = canvas.width;

    delete canvas[EXPANDO_KEY];
    return true;
  }

  /**
	 *
	 * @param {Chart} chart
	 * @param {string} type
	 * @param {function} listener
	 */
  addEventListener(chart, type, listener) {
    // Can have only one listener per type, so make sure previous is removed
    this.removeEventListener(chart, type);

    const proxies = chart.$proxies || (chart.$proxies = {});
    const handlers = {
      attach: createAttachObserver,
      detach: createDetachObserver,
      resize: createResizeObserver
    };
    const handler = handlers[type] || createProxyAndListen;
    proxies[type] = handler(chart, type, listener);
  }


  /**
	 * @param {Chart} chart
	 * @param {string} type
	 */
  removeEventListener(chart, type) {
    const proxies = chart.$proxies || (chart.$proxies = {});
    const proxy = proxies[type];

    if (!proxy) {
      return;
    }

    const handlers = {
      attach: releaseObserver,
      detach: releaseObserver,
      resize: releaseObserver
    };
    const handler = handlers[type] || removeListener;
    handler(chart, type, proxy);
    proxies[type] = undefined;
  }

  getDevicePixelRatio() {
    return window.devicePixelRatio;
  }

  /**
	 * @param {HTMLCanvasElement} canvas
	 * @param {number} [width] - content width of parent element
	 * @param {number} [height] - content height of parent element
	 * @param {number} [aspectRatio] - aspect ratio to maintain
	 */
  getMaximumSize(canvas, width, height, aspectRatio) {
    return getMaximumSize(canvas, width, height, aspectRatio);
  }

  /**
	 * @param {HTMLCanvasElement} canvas
	 */
  isAttached(canvas) {
    const container = _getParentNode(canvas);
    return !!(container && container.isConnected);
  }
}
