setOrientations(anno, annoIndex = null) {
  let w = this.w

  if (anno.label.orientation === 'vertical') {
    const i = annoIndex !== null ? annoIndex : 0
    let xAnno = w.globals.dom.baseEl.querySelector(
      `.apexcharts-xaxis-annotations .apexcharts-xaxis-annotation-label[rel='${i}']`
    )

    if (xAnno !== null) {
      const xAnnoCoord = xAnno.getBoundingClientRect()
      xAnno.setAttribute(
        'x',
        parseFloat(xAnno.getAttribute('x')) - xAnnoCoord.height + 4
      )

      if (anno.label.position === 'top') {
        xAnno.setAttribute(
          'y',
          parseFloat(xAnno.getAttribute('y')) + xAnnoCoord.width
        )
      } else {
        xAnno.setAttribute(
          'y',
          parseFloat(xAnno.getAttribute('y')) - xAnnoCoord.width
        )
      }

      let annoRotatingCenter = this.annoCtx.graphics.rotateAroundCenter(xAnno)
      const x = annoRotatingCenter.x
      const y = annoRotatingCenter.y

      xAnno.setAttribute('transform', `rotate(-90 ${x} ${y})`)
    }
  }
}
