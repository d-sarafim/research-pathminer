determineProjection(sources) {
  const firstSource = sources[0];
  for (let i = firstSource.length - 1; i >= 0; --i) {
    const image = firstSource[i];
    const projection = getProjection(image);
    if (projection) {
      this.projection = projection;
      break;
    }
  }
}
