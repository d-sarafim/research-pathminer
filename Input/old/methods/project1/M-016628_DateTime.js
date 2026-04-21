parseDate(dateStr) {
  const parsed = Date.parse(dateStr)
  if (!isNaN(parsed)) {
    return this.getTimeStamp(dateStr)
  }

  let output = Date.parse(dateStr.replace(/-/g, '/').replace(/[a-z]+/gi, ' '))
  output = this.getTimeStamp(output)
  return output
}
