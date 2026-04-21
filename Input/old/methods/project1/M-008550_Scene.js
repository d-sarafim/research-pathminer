clearBitmaps() {
    const ids = Object.keys(this.bitmaps);
    for (let i = 0, len = ids.length; i < len; i++) {
        this.bitmaps[ids[i]].destroy();
    }
}
