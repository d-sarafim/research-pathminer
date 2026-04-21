setupChangeEvents_(featureKey, feature) {
  this.featureChangeKeys_[featureKey] = [
    listen(feature, EventType.CHANGE, this.handleFeatureChange_, this),
    listen(
      feature,
      ObjectEventType.PROPERTYCHANGE,
      this.handleFeatureChange_,
      this
    ),
  ];
}
