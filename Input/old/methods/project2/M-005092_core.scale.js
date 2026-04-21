_layers() {
  const opts = this.options;
  const tz = opts.ticks && opts.ticks.z || 0;
  const gz = valueOrDefault(opts.grid && opts.grid.z, -1);
  const bz = valueOrDefault(opts.border && opts.border.z, 0);

  if (!this._isVisible() || this.draw !== Scale.prototype.draw) {
    // backward compatibility: draw has been overridden by custom scale
    return [{
      z: tz,
      draw: (chartArea) => {
        this.draw(chartArea);
      }
    }];
  }

  return [{
    z: gz,
    draw: (chartArea) => {
      this.drawBackground();
      this.drawGrid(chartArea);
      this.drawTitle();
    }
  }, {
    z: bz,
    draw: () => {
      this.drawBorder();
    }
  }, {
    z: tz,
    draw: (chartArea) => {
      this.drawLabels(chartArea);
    }
  }];
}
