class Custom extends BubbleController {
  draw() {
    // Call bubble controller method to draw all the points
    super.draw(arguments);

    // Now we can do some custom drawing for this dataset.
    // Here we'll draw a box around the first point in each dataset,
    // using `boxStrokeStyle` dataset option for color
    var meta = this.getMeta();
    var pt0 = meta.data[0];

    const {x, y} = pt0.getProps(['x', 'y']);
    const {radius} = pt0.options;

    var ctx = this.chart.ctx;
    ctx.save();
    ctx.strokeStyle = this.options.boxStrokeStyle;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - radius, y - radius, 2 * radius, 2 * radius);
    ctx.restore();
  }
}
