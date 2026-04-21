constructor(highWaterMark) {
  /**
   * Desired max cache size after expireCache(). If set to 0, no cache entries
   * will be pruned at all.
   * @type {number}
   */
  this.highWaterMark = highWaterMark !== undefined ? highWaterMark : 2048;

  /**
   * @private
   * @type {number}
   */
  this.count_ = 0;

  /**
   * @private
   * @type {!Object<string, Entry>}
   */
  this.entries_ = {};

  /**
   * @private
   * @type {?Entry}
   */
  this.oldest_ = null;

  /**
   * @private
   * @type {?Entry}
   */
  this.newest_ = null;
}
