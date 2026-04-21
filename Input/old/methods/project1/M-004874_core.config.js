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
