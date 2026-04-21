generateYearScale({
  firstVal,
  currentMonth,
  currentYear,
  daysWidthOnXAxis,
  numberOfYears
}) {
  let firstTickValue = firstVal.minYear
  let firstTickPosition = 0
  const dt = new DateTime(this.ctx)

  let unit = 'year'

  if (firstVal.minDate > 1 || firstVal.minMonth > 0) {
    let remainingDays = dt.determineRemainingDaysOfYear(
      firstVal.minYear,
      firstVal.minMonth,
      firstVal.minDate
    )

    // remainingDaysofFirstMonth is used to reacht the 2nd tick position
    let remainingDaysOfFirstYear =
      dt.determineDaysOfYear(firstVal.minYear) - remainingDays + 1

    // calculate the first tick position
    firstTickPosition = remainingDaysOfFirstYear * daysWidthOnXAxis
    firstTickValue = firstVal.minYear + 1
    // push the first tick in the array
    this.timeScaleArray.push({
      position: firstTickPosition,
      value: firstTickValue,
      unit,
      year: firstTickValue,
      month: Utils.monthMod(currentMonth + 1)
    })
  } else if (firstVal.minDate === 1 && firstVal.minMonth === 0) {
    // push the first tick in the array
    this.timeScaleArray.push({
      position: firstTickPosition,
      value: firstTickValue,
      unit,
      year: currentYear,
      month: Utils.monthMod(currentMonth + 1)
    })
  }

  let year = firstTickValue
  let pos = firstTickPosition

  // keep drawing rest of the ticks
  for (let i = 0; i < numberOfYears; i++) {
    year++
    pos = dt.determineDaysOfYear(year - 1) * daysWidthOnXAxis + pos
    this.timeScaleArray.push({
      position: pos,
      value: year,
      unit,
      year,
      month: 1
    })
  }
}
