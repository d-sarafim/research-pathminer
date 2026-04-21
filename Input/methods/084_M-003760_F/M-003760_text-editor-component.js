constructor(props) {
  this.props = {};
  this.element = document.createElement('div');
  this.element.className = 'highlights';
  this.element.style.contain = 'strict';
  this.element.style.position = 'absolute';
  this.element.style.overflow = 'hidden';
  this.element.style.userSelect = 'none';
  this.highlightComponentsByKey = new Map();
  this.update(props);
}
