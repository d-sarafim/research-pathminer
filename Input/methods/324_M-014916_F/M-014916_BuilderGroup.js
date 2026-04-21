getBuilder(zIndex, builderType) {
  const zIndexKey = zIndex !== undefined ? zIndex.toString() : '0';
  let replays = this.buildersByZIndex_[zIndexKey];
  if (replays === undefined) {
    replays = {};
    this.buildersByZIndex_[zIndexKey] = replays;
  }
  let replay = replays[builderType];
  if (replay === undefined) {
    const Constructor = BATCH_CONSTRUCTORS[builderType];
    replay = new Constructor(
      this.tolerance_,
      this.maxExtent_,
      this.resolution_,
      this.pixelRatio_
    );
    replays[builderType] = replay;
  }
  return replay;
}
