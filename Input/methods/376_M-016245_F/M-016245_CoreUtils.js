getSeriesTotalsXRange(minX, maxX) {
  const w = this.w

  const seriesTotalsXRange = w.globals.series.map((ser, index) => {
    let total = 0

    for (let j = 0; j < ser.length; j++) {
      if (
        w.globals.seriesX[index][j] > minX &&
        w.globals.seriesX[index][j] < maxX
      ) {
        total += ser[j]
      }
    }

    return total
  })

  return seriesTotalsXRange
}
