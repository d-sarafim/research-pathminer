class Range extends semver.Range {
  constructor() {
    super(...arguments);
    this.matchedVersions = new Set();
    this.unmatchedVersions = new Set();
  }

  test(version) {
    if (this.matchedVersions.has(version)) return true;
    if (this.unmatchedVersions.has(version)) return false;

    const matches = super.test(...arguments);
    if (matches) {
      this.matchedVersions.add(version);
    } else {
      this.unmatchedVersions.add(version);
    }
    return matches;
  }
}
