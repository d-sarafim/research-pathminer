enableWindowSpecificItems(enable) {
  for (let item of this.flattenMenuItems(this.menu)) {
    if (item.metadata && item.metadata.windowSpecific) item.enabled = enable;
  }
}
