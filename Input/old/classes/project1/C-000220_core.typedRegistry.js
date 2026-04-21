export default class TypedRegistry {
  constructor(type, scope, override) {
    this.type = type;
    this.scope = scope;
    this.override = override;
    this.items = Object.create(null);
  }

  isForType(type) {
    return Object.prototype.isPrototypeOf.call(this.type.prototype, type.prototype);
  }

  /**
	 * @param {IChartComponent} item
	 * @returns {string} The scope where items defaults were registered to.
	 */
  register(item) {
    const proto = Object.getPrototypeOf(item);
    let parentScope;

    if (isIChartComponent(proto)) {
      // Make sure the parent is registered and note the scope where its defaults are.
      parentScope = this.register(proto);
    }

    const items = this.items;
    const id = item.id;
    const scope = this.scope + '.' + id;

    if (!id) {
      throw new Error('class does not have id: ' + item);
    }

    if (id in items) {
      // already registered
      return scope;
    }

    items[id] = item;
    registerDefaults(item, scope, parentScope);
    if (this.override) {
      defaults.override(item.id, item.overrides);
    }

    return scope;
  }

  /**
	 * @param {string} id
	 * @returns {object?}
	 */
  get(id) {
    return this.items[id];
  }

  /**
	 * @param {IChartComponent} item
	 */
  unregister(item) {
    const items = this.items;
    const id = item.id;
    const scope = this.scope;

    if (id in items) {
      delete items[id];
    }

    if (scope && id in defaults[scope]) {
      delete defaults[scope][id];
      if (this.override) {
        delete overrides[id];
      }
    }
  }
}
