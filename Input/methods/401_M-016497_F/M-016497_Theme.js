updateThemeOptions(options) {
  options.chart = options.chart || {}
  options.tooltip = options.tooltip || {}
  const mode = options.theme.mode || 'light'
  const palette = options.theme.palette
    ? options.theme.palette
    : mode === 'dark'
    ? 'palette4'
    : 'palette1'
  const foreColor = options.chart.foreColor
    ? options.chart.foreColor
    : mode === 'dark'
    ? '#f6f7f8'
    : '#373d3f'

  options.tooltip.theme = mode
  options.chart.foreColor = foreColor
  options.theme.palette = palette

  return options
}
