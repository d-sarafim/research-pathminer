logarithmicScale(yMin, yMax, base) {
  // Basic validation to avoid for loop starting at -inf.
  if (yMax <= 0) yMax = Math.max(yMin, base)
  if (yMin <= 0) yMin = Math.min(yMax, base)

  const logs = []

  // Get the logarithmic range.
  const logMax = Math.log(yMax) / Math.log(base)
  const logMin = Math.log(yMin) / Math.log(base)

  // Get the exact logarithmic range.
  // (This is the exact number of multiples of the base there are between yMin and yMax).
  const logRange = logMax - logMin

  // Round the logarithmic range to get the number of ticks we will create.
  // If the chosen min/max values are multiples of each other WRT the base, this will be neat.
  // If the chosen min/max aren't, we will at least still provide USEFUL ticks.
  const ticks = Math.round(logRange)

  // Get the logarithmic spacing between ticks.
  const logTickSpacing = logRange / ticks

  // Create as many ticks as there is range in the logs.
  for (
    let i = 0, logTick = logMin;
    i < ticks;
    i++, logTick += logTickSpacing
  ) {
    logs.push(Math.pow(base, logTick))
  }

  // Add a final tick at the yMax.
  logs.push(Math.pow(base, logMax))

  return {
    result: logs,
    niceMin: yMin,
    niceMax: yMax,
  }
}
