class DockResizeHandle {
  constructor(props) {
    this.props = props;
    etch.initialize(this);
  }

  render() {
    const classList = ['atom-dock-resize-handle', this.props.location];
    if (this.props.dockIsVisible) classList.push(RESIZE_HANDLE_RESIZABLE_CLASS);

    return $.div({
      className: classList.join(' '),
      on: { mousedown: this.handleMouseDown }
    });
  }

  getElement() {
    return this.element;
  }

  getSize() {
    if (!this.size) {
      this.size = this.element.getBoundingClientRect()[
        getWidthOrHeight(this.props.location)
      ];
    }
    return this.size;
  }

  update(newProps) {
    this.props = Object.assign({}, this.props, newProps);
    return etch.update(this);
  }

  handleMouseDown(event) {
    if (event.detail === 2) {
      this.props.onResizeToFit();
    } else if (this.props.dockIsVisible) {
      this.props.onResizeStart();
    }
  }
}
