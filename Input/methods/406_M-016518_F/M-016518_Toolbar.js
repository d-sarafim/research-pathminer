_createHamburgerMenu(parent) {
  this.elMenuItems = []
  parent.appendChild(this.elMenu)

  Graphics.setAttrs(this.elMenu, {
    class: 'apexcharts-menu'
  })

  const menuItems = [
    {
      name: 'exportSVG',
      title: this.localeValues.exportToSVG
    },
    {
      name: 'exportPNG',
      title: this.localeValues.exportToPNG
    },
    {
      name: 'exportCSV',
      title: this.localeValues.exportToCSV
    }
  ]

  if (!this.w.globals.allSeriesHasEqualX) {
    // if it is a multi series, and all series have variable x values, export CSV won't work
    menuItems.splice(2, 1)
  }
  for (let i = 0; i < menuItems.length; i++) {
    this.elMenuItems.push(document.createElement('div'))
    this.elMenuItems[i].innerHTML = menuItems[i].title
    Graphics.setAttrs(this.elMenuItems[i], {
      class: `apexcharts-menu-item ${menuItems[i].name}`,
      title: menuItems[i].title
    })
    this.elMenu.appendChild(this.elMenuItems[i])
  }
}
