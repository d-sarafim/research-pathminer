buildOrUpdateControllers() {
  const newControllers = [];
  const datasets = this.data.datasets;
  let i, ilen;

  this._removeUnreferencedMetasets();

  for (i = 0, ilen = datasets.length; i < ilen; i++) {
    const dataset = datasets[i];
    let meta = this.getDatasetMeta(i);
    const type = dataset.type || this.config.type;

    if (meta.type && meta.type !== type) {
      this._destroyDatasetMeta(i);
      meta = this.getDatasetMeta(i);
    }
    meta.type = type;
    meta.indexAxis = dataset.indexAxis || getIndexAxis(type, this.options);
    meta.order = dataset.order || 0;
    meta.index = i;
    meta.label = '' + dataset.label;
    meta.visible = this.isDatasetVisible(i);

    if (meta.controller) {
      meta.controller.updateIndex(i);
      meta.controller.linkScales();
    } else {
      const ControllerClass = registry.getController(type);
      const {datasetElementType, dataElementType} = defaults.datasets[type];
      Object.assign(ControllerClass, {
        dataElementType: registry.getElement(dataElementType),
        datasetElementType: datasetElementType && registry.getElement(datasetElementType)
      });
      meta.controller = new ControllerClass(this, i);
      newControllers.push(meta.controller);
    }
  }

  this._updateMetasets();
  return newControllers;
}
