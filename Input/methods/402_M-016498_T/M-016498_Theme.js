predefined() {
  let palette = this.w.config.theme.palette

  // D6E3F8, FCEFEF, DCE0D9, A5978B, EDDDD4, D6E3F8, FEF5EF
  switch (palette) {
    case 'palette1':
      this.colors = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0']
      break
    case 'palette2':
      this.colors = ['#3f51b5', '#03a9f4', '#4caf50', '#f9ce1d', '#FF9800']
      break
    case 'palette3':
      this.colors = ['#33b2df', '#546E7A', '#d4526e', '#13d8aa', '#A5978B']
      break
    case 'palette4':
      this.colors = ['#4ecdc4', '#c7f464', '#81D4FA', '#fd6a6a', '#546E7A']
      break
    case 'palette5':
      this.colors = ['#2b908f', '#f9a3a4', '#90ee7e', '#fa4443', '#69d2e7']
      break
    case 'palette6':
      this.colors = ['#449DD1', '#F86624', '#EA3546', '#662E9B', '#C5D86D']
      break
    case 'palette7':
      this.colors = ['#D7263D', '#1B998B', '#2E294E', '#F46036', '#E2C044']
      break
    case 'palette8':
      this.colors = ['#662E9B', '#F86624', '#F9C80E', '#EA3546', '#43BCCD']
      break
    case 'palette9':
      this.colors = ['#5C4742', '#A5978B', '#8D5B4C', '#5A2A27', '#C4BBAF']
      break
    case 'palette10':
      this.colors = ['#A300D6', '#7D02EB', '#5653FE', '#2983FF', '#00B1F2']
      break
    default:
      this.colors = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0']
      break
  }
  return this.colors
}
