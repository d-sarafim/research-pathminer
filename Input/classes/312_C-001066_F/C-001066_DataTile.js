class DataTile extends Tile {
  /**
   * @param {Options} options Tile options.
   */
  constructor(options) {
    const state = TileState.IDLE;

    super(options.tileCoord, state, {
      transition: options.transition,
      interpolate: options.interpolate,
    });

    /**
     * @type {function(): Promise<Data>}
     * @private
     */
    this.loader_ = options.loader;

    /**
     * @type {Data}
     * @private
     */
    this.data_ = null;

    /**
     * @type {Error}
     * @private
     */
    this.error_ = null;

    /**
     * @type {import('./size.js').Size|null}
     * @private
     */
    this.size_ = options.size || null;
  }

  /**
   * Get the tile size.
   * @return {import('./size.js').Size} Tile size.
   */
  getSize() {
    if (this.size_) {
      return this.size_;
    }
    const imageData = asImageLike(this.data_);
    if (imageData) {
      return [imageData.width, imageData.height];
    }
    return defaultSize;
  }

  /**
   * Get the data for the tile.
   * @return {Data} Tile data.
   * @api
   */
  getData() {
    return this.data_;
  }

  /**
   * Get any loading error.
   * @return {Error} Loading error.
   * @api
   */
  getError() {
    return this.error_;
  }

  /**
   * Load not yet loaded URI.
   * @api
   */
  load() {
    if (this.state !== TileState.IDLE && this.state !== TileState.ERROR) {
      return;
    }
    this.state = TileState.LOADING;
    this.changed();

    const self = this;
    this.loader_()
      .then(function (data) {
        self.data_ = data;
        self.state = TileState.LOADED;
        self.changed();
      })
      .catch(function (error) {
        self.error_ = error;
        self.state = TileState.ERROR;
        self.changed();
      });
  }
}
