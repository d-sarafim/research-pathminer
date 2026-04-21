getPreviousPath(realIndex) {
  let w = this.w
  let pathFrom = null
  for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
    let gpp = w.globals.previousPaths[pp]

    if (
      gpp.paths.length > 0 &&
      parseInt(gpp.realIndex, 10) === parseInt(realIndex, 10)
    ) {
      if (typeof w.globals.previousPaths[pp].paths[0] !== 'undefined') {
        pathFrom = w.globals.previousPaths[pp].paths[0].d
      }
    }
  }
  return pathFrom
}
