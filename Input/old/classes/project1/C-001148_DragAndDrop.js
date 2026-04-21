class DragAndDrop extends Interaction {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    super({
      handleEvent: TRUE,
    });

    /***
     * @type {DragAndDropOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {DragAndDropOnSignature<import("../events").EventsKey>}
     */
    this.once;

    /***
     * @type {DragAndDropOnSignature<void>}
     */
    this.un;

    /**
     * @private
     * @type {boolean}
     */
    this.readAsBuffer_ = false;

    /**
     * @private
     * @type {Array<import("../format/Feature.js").default>}
     */
    this.formats_ = [];
    const formatConstructors = options.formatConstructors
      ? options.formatConstructors
      : [];
    for (let i = 0, ii = formatConstructors.length; i < ii; ++i) {
      let format = formatConstructors[i];
      if (typeof format === 'function') {
        format = new format();
      }
      this.formats_.push(format);
      this.readAsBuffer_ =
        this.readAsBuffer_ || format.getType() === 'arraybuffer';
    }

    /**
     * @private
     * @type {import("../proj/Projection.js").default}
     */
    this.projection_ = options.projection
      ? getProjection(options.projection)
      : null;

    /**
     * @private
     * @type {?Array<import("../events.js").EventsKey>}
     */
    this.dropListenKeys_ = null;

    /**
     * @private
     * @type {import("../source/Vector.js").default}
     */
    this.source_ = options.source || null;

    /**
     * @private
     * @type {HTMLElement|null}
     */
    this.target = options.target ? options.target : null;
  }

  /**
   * @param {File} file File.
   * @param {Event} event Load event.
   * @private
   */
  handleResult_(file, event) {
    const result = event.target.result;
    const map = this.getMap();
    let projection = this.projection_;
    if (!projection) {
      projection = getUserProjection();
      if (!projection) {
        const view = map.getView();
        projection = view.getProjection();
      }
    }

    let text;
    const formats = this.formats_;
    for (let i = 0, ii = formats.length; i < ii; ++i) {
      const format = formats[i];
      let input = result;
      if (this.readAsBuffer_ && format.getType() !== 'arraybuffer') {
        if (text === undefined) {
          text = new TextDecoder().decode(result);
        }
        input = text;
      }
      const features = this.tryReadFeatures_(format, input, {
        featureProjection: projection,
      });
      if (features && features.length > 0) {
        if (this.source_) {
          this.source_.clear();
          this.source_.addFeatures(features);
        }
        this.dispatchEvent(
          new DragAndDropEvent(
            DragAndDropEventType.ADD_FEATURES,
            file,
            features,
            projection
          )
        );
        break;
      }
    }
  }

  /**
   * @private
   */
  registerListeners_() {
    const map = this.getMap();
    if (map) {
      const dropArea = this.target ? this.target : map.getViewport();
      this.dropListenKeys_ = [
        listen(dropArea, EventType.DROP, this.handleDrop, this),
        listen(dropArea, EventType.DRAGENTER, this.handleStop, this),
        listen(dropArea, EventType.DRAGOVER, this.handleStop, this),
        listen(dropArea, EventType.DROP, this.handleStop, this),
      ];
    }
  }

  /**
   * Activate or deactivate the interaction.
   * @param {boolean} active Active.
   * @observable
   * @api
   */
  setActive(active) {
    if (!this.getActive() && active) {
      this.registerListeners_();
    }
    if (this.getActive() && !active) {
      this.unregisterListeners_();
    }
    super.setActive(active);
  }

  /**
   * Remove the interaction from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../Map.js").default} map Map.
   */
  setMap(map) {
    this.unregisterListeners_();
    super.setMap(map);
    if (this.getActive()) {
      this.registerListeners_();
    }
  }

  /**
   * @param {import("../format/Feature.js").default} format Format.
   * @param {string} text Text.
   * @param {import("../format/Feature.js").ReadOptions} options Read options.
   * @private
   * @return {Array<import("../Feature.js").default>} Features.
   */
  tryReadFeatures_(format, text, options) {
    try {
      return (
        /** @type {Array<import("../Feature.js").default>} */
        (format.readFeatures(text, options))
      );
    } catch (e) {
      return null;
    }
  }

  /**
   * @private
   */
  unregisterListeners_() {
    if (this.dropListenKeys_) {
      this.dropListenKeys_.forEach(unlistenByKey);
      this.dropListenKeys_ = null;
    }
  }

  /**
   * @param {DragEvent} event Event.
   */
  handleDrop(event) {
    const files = event.dataTransfer.files;
    for (let i = 0, ii = files.length; i < ii; ++i) {
      const file = files.item(i);
      const reader = new FileReader();
      reader.addEventListener(
        EventType.LOAD,
        this.handleResult_.bind(this, file)
      );
      if (this.readAsBuffer_) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    }
  }

  /**
   * @param {DragEvent} event Event.
   */
  handleStop(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }
}
