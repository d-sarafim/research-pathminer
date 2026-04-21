radialBar() {
  return {
    chart: {
      animations: {
        dynamicAnimation: {
          enabled: true,
          speed: 800,
        },
      },
      toolbar: {
        show: false,
      },
    },
    fill: {
      gradient: {
        shade: 'dark',
        shadeIntensity: 0.4,
        inverseColors: false,
        type: 'diagonal2',
        opacityFrom: 1,
        opacityTo: 1,
        stops: [70, 98, 100],
      },
    },
    legend: {
      show: false,
      position: 'right',
    },
    tooltip: {
      enabled: false,
      fillSeriesColor: true,
    },
  }
}
