cssTransform(target, redrawAnnotations = false) {
  const width = this.viewport.width;
  const height = this.viewport.height;
  const div = this.div;
  target.style.width = target.parentNode.style.width = div.style.width = Math.floor(width) + "px";
  target.style.height = target.parentNode.style.height = div.style.height = Math.floor(height) + "px";
  const relativeRotation = this.viewport.rotation - this.paintedViewportMap.get(target).rotation;
  const absRotation = Math.abs(relativeRotation);
  let scaleX = 1,
      scaleY = 1;

  if (absRotation === 90 || absRotation === 270) {
    scaleX = height / width;
    scaleY = width / height;
  }

  target.style.transform = `rotate(${relativeRotation}deg) scale(${scaleX}, ${scaleY})`;

  if (this.textLayer) {
    const textLayerViewport = this.textLayer.viewport;
    const textRelativeRotation = this.viewport.rotation - textLayerViewport.rotation;
    const textAbsRotation = Math.abs(textRelativeRotation);
    let scale = width / textLayerViewport.width;

    if (textAbsRotation === 90 || textAbsRotation === 270) {
      scale = width / textLayerViewport.height;
    }

    const textLayerDiv = this.textLayer.textLayerDiv;
    let transX, transY;

    switch (textAbsRotation) {
      case 0:
        transX = transY = 0;
        break;

      case 90:
        transX = 0;
        transY = "-" + textLayerDiv.style.height;
        break;

      case 180:
        transX = "-" + textLayerDiv.style.width;
        transY = "-" + textLayerDiv.style.height;
        break;

      case 270:
        transX = "-" + textLayerDiv.style.width;
        transY = 0;
        break;

      default:
        console.error("Bad rotation value.");
        break;
    }

    textLayerDiv.style.transform = `rotate(${textAbsRotation}deg) ` + `scale(${scale}) ` + `translate(${transX}, ${transY})`;
    textLayerDiv.style.transformOrigin = "0% 0%";
  }

  if (redrawAnnotations && this.annotationLayer) {
    this._renderAnnotationLayer();
  }

  if (this.xfaLayer) {
    this._renderXfaLayer();
  }
}
