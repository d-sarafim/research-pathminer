getMinMax() {
  const meta = this._cachedMeta;
  const range = {min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY};

  meta.data.forEach((element, index) => {
    const parsed = this.getParsed(index).r;

    if (!isNaN(parsed) && this.chart.getDataVisibility(index)) {
      if (parsed < range.min) {
        range.min = parsed;
      }

      if (parsed > range.max) {
        range.max = parsed;
      }
    }
  });

  return range;
}
