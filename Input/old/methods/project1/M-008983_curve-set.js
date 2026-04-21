value(time, result = []) {
    const length = this.curves.length;
    result.length = length;

    for (let i = 0; i < length; i++) {
        result[i] = this.curves[i].value(time);
    }

    return result;
}
