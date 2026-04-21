getElementsAtEventForMode(e, mode, options, useFinalPosition) {
  const method = Interaction.modes[mode];
  if (typeof method === 'function') {
    return method(this, e, options, useFinalPosition);
  }

  return [];
}
