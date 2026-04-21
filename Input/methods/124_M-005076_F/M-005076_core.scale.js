getBaseValue() {
  const {min, max} = this;

  return min < 0 && max < 0 ? max :
    min > 0 && max > 0 ? min :
    0;
}
