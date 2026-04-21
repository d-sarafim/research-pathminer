svgUrl() {
  this.cleanup()

  const svgData = this.getSvgString()
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  return URL.createObjectURL(svgBlob)
}
