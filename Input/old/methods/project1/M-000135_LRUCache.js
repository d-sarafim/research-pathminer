constructor(max, onRemove) {
    this.max = max;
    this.onRemove = onRemove || nullOnRemove;
    this.reset();
}
