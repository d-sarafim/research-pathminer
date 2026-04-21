normalize(values) {
  // It seems to be somewhat faster to do sorting first
  return _arrayUnique(values.sort(sorter));
}
