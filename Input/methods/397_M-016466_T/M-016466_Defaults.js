funnel() {
  this.hideYAxis()

  return {
    ...this.bar(),
    chart: {
      animations: {
        easing: 'linear',
        speed: 800,
        animateGradually: {
          enabled: false,
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadiusApplication: 'around',
        borderRadius: 0,
        dataLabels: {
          position: 'center',
        },
      },
    },
    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0,
      },
    },
    xaxis: {
      labels: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
  }
}
