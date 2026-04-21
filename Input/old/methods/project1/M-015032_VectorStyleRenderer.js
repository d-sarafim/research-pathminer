generateRenderInstructions_(geometryBatch, transform) {
  const polygonInstructions = this.hasFill_
    ? generatePolygonRenderInstructions(
        geometryBatch.polygonBatch,
        new Float32Array(0),
        this.customAttributes_,
        transform
      )
    : null;
  const lineStringInstructions = this.hasStroke_
    ? generateLineStringRenderInstructions(
        geometryBatch.lineStringBatch,
        new Float32Array(0),
        this.customAttributes_,
        transform
      )
    : null;
  const pointInstructions = this.hasSymbol_
    ? generatePointRenderInstructions(
        geometryBatch.pointBatch,
        new Float32Array(0),
        this.customAttributes_,
        transform
      )
    : null;

  return {
    polygonInstructions,
    lineStringInstructions,
    pointInstructions,
  };
}
