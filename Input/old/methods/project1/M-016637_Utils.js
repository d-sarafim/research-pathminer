static bind(fn, me) {
  return function () {
    return fn.apply(me, arguments)
  }
}
