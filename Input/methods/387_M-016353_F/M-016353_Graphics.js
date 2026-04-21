curve(x1, y1, x2, y2, x, y) {
  let curve = ['C', x1, y1, x2, y2, x, y].join(' ')
  return curve
}
