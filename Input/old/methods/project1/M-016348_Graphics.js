drawCircle(radius, attrs = null) {
  const w = this.w

  if (radius < 0) radius = 0
  const c = w.globals.dom.Paper.circle(radius * 2)
  if (attrs !== null) {
    c.attr(attrs)
  }
  return c
}
