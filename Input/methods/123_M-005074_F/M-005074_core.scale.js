getDecimalForPixel(pixel) {
  const decimal = (pixel - this._startPixel) / this._length;
  return this._reversePixels ? 1 - decimal : decimal;
}
