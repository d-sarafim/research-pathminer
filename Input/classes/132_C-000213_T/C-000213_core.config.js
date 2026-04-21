export default class Config {
  constructor(config) {
    this._config = initConfig(config);
    this._scopeCache = new Map();
    this._resolverCache = new Map();
  }

  get platform() {
    return this._config.platform;
  }

  get type() {
    return this._config.type;
  }

  set type(type) {
    this._config.type = type;
  }

  get data() {
    return this._config.data;
  }

  set data(data) {
    this._config.data = initData(data);
  }

  get options() {
    return this._config.options;
  }

  set options(options) {
    this._config.options = options;
  }

  get plugins() {
    return this._config.plugins;
  }

  update() {
    const config = this._config;
    this.clearCache();
    initOptions(config);
  }

  clearCache() {
    this._scopeCache.clear();
    this._resolverCache.clear();
  }

  /**
   * Returns the option scope keys for resolving dataset options.
   * These keys do not include the dataset itself, because it is not under options.
   * @param {string} datasetType
   * @return {string[][]}
   */
  datasetScopeKeys(datasetType) {
    return cachedKeys(datasetType,
      () => [[
        `datasets.${datasetType}`,
        ''
      ]]);
  }

  /**
   * Returns the option scope keys for resolving dataset animation options.
   * These keys do not include the dataset itself, because it is not under options.
   * @param {string} datasetType
   * @param {string} transition
   * @return {string[][]}
   */
  datasetAnimationScopeKeys(datasetType, transition) {
    return cachedKeys(`${datasetType}.transition.${transition}`,
      () => [
        [
          `datasets.${datasetType}.transitions.${transition}`,
          `transitions.${transition}`,
        ],
        // The following are used for looking up the `animations` and `animation` keys
        [
          `datasets.${datasetType}`,
          ''
        ]
      ]);
  }

  /**
   * Returns the options scope keys for resolving element options that belong
   * to an dataset. These keys do not include the dataset itself, because it
   * is not under options.
   * @param {string} datasetType
   * @param {string} elementType
   * @return {string[][]}
   */
  datasetElementScopeKeys(datasetType, elementType) {
    return cachedKeys(`${datasetType}-${elementType}`,
      () => [[
        `datasets.${datasetType}.elements.${elementType}`,
        `datasets.${datasetType}`,
        `elements.${elementType}`,
        ''
      ]]);
  }

  /**
   * Returns the options scope keys for resolving plugin options.
   * @param {{id: string, additionalOptionScopes?: string[]}} plugin
   * @return {string[][]}
   */
  pluginScopeKeys(plugin) {
    const id = plugin.id;
    const type = this.type;
    return cachedKeys(`${type}-plugin-${id}`,
      () => [[
        `plugins.${id}`,
        ...plugin.additionalOptionScopes || [],
      ]]);
  }

  /**
   * @private
   */
  _cachedScopes(mainScope, resetCache) {
    const _scopeCache = this._scopeCache;
    let cache = _scopeCache.get(mainScope);
    if (!cache || resetCache) {
      cache = new Map();
      _scopeCache.set(mainScope, cache);
    }
    return cache;
  }

  /**
   * Resolves the objects from options and defaults for option value resolution.
   * @param {object} mainScope - The main scope object for options
   * @param {string[][]} keyLists - The arrays of keys in resolution order
   * @param {boolean} [resetCache] - reset the cache for this mainScope
   */
  getOptionScopes(mainScope, keyLists, resetCache) {
    const {options, type} = this;
    const cache = this._cachedScopes(mainScope, resetCache);
    const cached = cache.get(keyLists);
    if (cached) {
      return cached;
    }

    const scopes = new Set();

    keyLists.forEach(keys => {
      if (mainScope) {
        scopes.add(mainScope);
        keys.forEach(key => addIfFound(scopes, mainScope, key));
      }
      keys.forEach(key => addIfFound(scopes, options, key));
      keys.forEach(key => addIfFound(scopes, overrides[type] || {}, key));
      keys.forEach(key => addIfFound(scopes, defaults, key));
      keys.forEach(key => addIfFound(scopes, descriptors, key));
    });

    const array = Array.from(scopes);
    if (array.length === 0) {
      array.push(Object.create(null));
    }
    if (keysCached.has(keyLists)) {
      cache.set(keyLists, array);
    }
    return array;
  }

  /**
   * Returns the option scopes for resolving chart options
   * @return {object[]}
   */
  chartOptionScopes() {
    const {options, type} = this;

    return [
      options,
      overrides[type] || {},
      defaults.datasets[type] || {}, // https://github.com/chartjs/Chart.js/issues/8531
      {type},
      defaults,
      descriptors
    ];
  }

  /**
   * @param {object[]} scopes
   * @param {string[]} names
   * @param {function|object} context
   * @param {string[]} [prefixes]
   * @return {object}
   */
  resolveNamedOptions(scopes, names, context, prefixes = ['']) {
    const result = {$shared: true};
    const {resolver, subPrefixes} = getResolver(this._resolverCache, scopes, prefixes);
    let options = resolver;
    if (needContext(resolver, names)) {
      result.$shared = false;
      context = isFunction(context) ? context() : context;
      // subResolver is passed to scriptable options. It should not resolve to hover options.
      const subResolver = this.createResolver(scopes, context, subPrefixes);
      options = _attachContext(resolver, context, subResolver);
    }

    for (const prop of names) {
      result[prop] = options[prop];
    }
    return result;
  }

  /**
   * @param {object[]} scopes
   * @param {object} [context]
   * @param {string[]} [prefixes]
   * @param {{scriptable: boolean, indexable: boolean, allKeys?: boolean}} [descriptorDefaults]
   */
  createResolver(scopes, context, prefixes = [''], descriptorDefaults) {
    const {resolver} = getResolver(this._resolverCache, scopes, prefixes);
    return isObject(context)
      ? _attachContext(resolver, context, undefined, descriptorDefaults)
      : resolver;
  }
}
