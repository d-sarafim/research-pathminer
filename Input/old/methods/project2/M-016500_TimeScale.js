calculateTimeScaleTicks(minX, maxX) {
  let w = this.w

  // null check when no series to show
  if (w.globals.allSeriesCollapsed) {
    w.globals.labels = []
    w.globals.timescaleLabels = []
    return []
  }

  let dt = new DateTime(this.ctx)

  const daysDiff = (maxX - minX) / (1000 * SECONDS_IN_DAY)
  this.determineInterval(daysDiff)

  w.globals.disableZoomIn = false
  w.globals.disableZoomOut = false

  if (daysDiff < MIN_ZOOM_DAYS) {
    w.globals.disableZoomIn = true
  } else if (daysDiff > 50000) {
    w.globals.disableZoomOut = true
  }

  const timeIntervals = dt.getTimeUnitsfromTimestamp(minX, maxX, this.utc)

  const daysWidthOnXAxis = w.globals.gridWidth / daysDiff
  const hoursWidthOnXAxis = daysWidthOnXAxis / 24
  const minutesWidthOnXAxis = hoursWidthOnXAxis / 60
  const secondsWidthOnXAxis = minutesWidthOnXAxis / 60

  let numberOfHours = Math.floor(daysDiff * 24)
  let numberOfMinutes = Math.floor(daysDiff * MINUTES_IN_DAY)
  let numberOfSeconds = Math.floor(daysDiff * SECONDS_IN_DAY)
  let numberOfDays = Math.floor(daysDiff)
  let numberOfMonths = Math.floor(daysDiff / 30)
  let numberOfYears = Math.floor(daysDiff / 365)

  const firstVal = {
    minMillisecond: timeIntervals.minMillisecond,
    minSecond: timeIntervals.minSecond,
    minMinute: timeIntervals.minMinute,
    minHour: timeIntervals.minHour,
    minDate: timeIntervals.minDate,
    minMonth: timeIntervals.minMonth,
    minYear: timeIntervals.minYear
  }

  let currentMillisecond = firstVal.minMillisecond
  let currentSecond = firstVal.minSecond
  let currentMinute = firstVal.minMinute
  let currentHour = firstVal.minHour
  let currentMonthDate = firstVal.minDate
  let currentDate = firstVal.minDate
  let currentMonth = firstVal.minMonth
  let currentYear = firstVal.minYear

  const params = {
    firstVal,
    currentMillisecond,
    currentSecond,
    currentMinute,
    currentHour,
    currentMonthDate,
    currentDate,
    currentMonth,
    currentYear,
    daysWidthOnXAxis,
    hoursWidthOnXAxis,
    minutesWidthOnXAxis,
    secondsWidthOnXAxis,
    numberOfSeconds,
    numberOfMinutes,
    numberOfHours,
    numberOfDays,
    numberOfMonths,
    numberOfYears
  }

  switch (this.tickInterval) {
    case 'years': {
      this.generateYearScale(params)
      break
    }
    case 'months':
    case 'half_year': {
      this.generateMonthScale(params)
      break
    }
    case 'months_days':
    case 'months_fortnight':
    case 'days':
    case 'week_days': {
      this.generateDayScale(params)
      break
    }
    case 'hours': {
      this.generateHourScale(params)
      break
    }
    case 'minutes_fives':
    case 'minutes':
      this.generateMinuteScale(params)
      break
    case 'seconds_tens':
    case 'seconds_fives':
    case 'seconds':
      this.generateSecondScale(params)
      break
  }

  // first, we will adjust the month values index
  // as in the upper function, it is starting from 0
  // we will start them from 1
  const adjustedMonthInTimeScaleArray = this.timeScaleArray.map((ts) => {
    let defaultReturn = {
      position: ts.position,
      unit: ts.unit,
      year: ts.year,
      day: ts.day ? ts.day : 1,
      hour: ts.hour ? ts.hour : 0,
      month: ts.month + 1
    }
    if (ts.unit === 'month') {
      return {
        ...defaultReturn,
        day: 1,
        value: ts.value + 1
      }
    } else if (ts.unit === 'day' || ts.unit === 'hour') {
      return {
        ...defaultReturn,
        value: ts.value
      }
    } else if (ts.unit === 'minute') {
      return {
        ...defaultReturn,
        value: ts.value,
        minute: ts.value
      }
    } else if (ts.unit === 'second') {
      return {
        ...defaultReturn,
        value: ts.value,
        minute: ts.minute,
        second: ts.second
      }
    }

    return ts
  })

  const filteredTimeScale = adjustedMonthInTimeScaleArray.filter((ts) => {
    let modulo = 1
    let ticks = Math.ceil(w.globals.gridWidth / 120)
    let value = ts.value
    if (w.config.xaxis.tickAmount !== undefined) {
      ticks = w.config.xaxis.tickAmount
    }
    if (adjustedMonthInTimeScaleArray.length > ticks) {
      modulo = Math.floor(adjustedMonthInTimeScaleArray.length / ticks)
    }

    let shouldNotSkipUnit = false // there is a big change in unit i.e days to months
    let shouldNotPrint = false // should skip these values

    switch (this.tickInterval) {
      case 'years':
        // make years label denser
        if (ts.unit === 'year') {
          shouldNotSkipUnit = true
        }
        break
      case 'half_year':
        modulo = 7
        if (ts.unit === 'year') {
          shouldNotSkipUnit = true
        }
        break
      case 'months':
        modulo = 1
        if (ts.unit === 'year') {
          shouldNotSkipUnit = true
        }
        break
      case 'months_fortnight':
        modulo = 15
        if (ts.unit === 'year' || ts.unit === 'month') {
          shouldNotSkipUnit = true
        }
        if (value === 30) {
          shouldNotPrint = true
        }
        break
      case 'months_days':
        modulo = 10
        if (ts.unit === 'month') {
          shouldNotSkipUnit = true
        }
        if (value === 30) {
          shouldNotPrint = true
        }
        break
      case 'week_days':
        modulo = 8
        if (ts.unit === 'month') {
          shouldNotSkipUnit = true
        }
        break
      case 'days':
        modulo = 1
        if (ts.unit === 'month') {
          shouldNotSkipUnit = true
        }
        break
      case 'hours':
        if (ts.unit === 'day') {
          shouldNotSkipUnit = true
        }
        break
      case 'minutes_fives':
        if (value % 5 !== 0) {
          shouldNotPrint = true
        }
        break
      case 'seconds_tens':
        if (value % 10 !== 0) {
          shouldNotPrint = true
        }
        break
      case 'seconds_fives':
        if (value % 5 !== 0) {
          shouldNotPrint = true
        }
        break
    }

    if (
      this.tickInterval === 'hours' ||
      this.tickInterval === 'minutes_fives' ||
      this.tickInterval === 'seconds_tens' ||
      this.tickInterval === 'seconds_fives'
    ) {
      if (!shouldNotPrint) {
        return true
      }
    } else {
      if ((value % modulo === 0 || shouldNotSkipUnit) && !shouldNotPrint) {
        return true
      }
    }
  })

  return filteredTimeScale
}
