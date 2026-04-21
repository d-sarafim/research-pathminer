static deserialize(
  state,
  { deserializers, applicationDelegate, config, notifications, views }
) {
  const { activeItemIndex } = state;
  const activeItemURI = state.activeItemURI || state.activeItemUri;

  const items = [];
  for (const itemState of state.items) {
    const item = deserializers.deserialize(itemState);
    if (item) items.push(item);
  }
  state.items = items;

  state.activeItem = items[activeItemIndex];
  if (!state.activeItem && activeItemURI) {
    state.activeItem = state.items.find(
      item =>
        typeof item.getURI === 'function' && item.getURI() === activeItemURI
    );
  }

  return new Pane(
    Object.assign(
      {
        deserializerManager: deserializers,
        notificationManager: notifications,
        viewRegistry: views,
        config,
        applicationDelegate
      },
      state
    )
  );
}
