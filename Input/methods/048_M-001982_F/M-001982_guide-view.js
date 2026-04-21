getApplicationMenuName() {
  if (process.platform === 'darwin') {
    return 'Atom';
  } else if (process.platform === 'linux') {
    return 'Edit';
  } else {
    return 'File';
  }
}
