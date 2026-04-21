getDxDy() {
    const s = this.dxdy;
    return new Point(s['dx'] || 0, s['dy'] || 0);
}
