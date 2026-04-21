class CustomGutterComponent {
  constructor(props) {
    this.props = props;
    this.element = this.props.element;
    this.virtualNode = $.div(null);
    this.virtualNode.domNode = this.element;
    etch.updateSync(this);
  }

  update(props) {
    this.props = props;
    etch.updateSync(this);
  }

  destroy() {
    etch.destroy(this);
  }

  render() {
    let className = 'gutter';
    if (this.props.className) {
      className += ' ' + this.props.className;
    }
    return $.div(
      {
        className,
        attributes: { 'gutter-name': this.props.name },
        style: {
          display: this.props.visible ? '' : 'none'
        }
      },
      $.div(
        {
          className: 'custom-decorations',
          style: { height: this.props.height + 'px' }
        },
        this.renderDecorations()
      )
    );
  }

  renderDecorations() {
    if (!this.props.decorations) return null;

    return this.props.decorations.map(({ className, element, top, height }) => {
      return $(CustomGutterDecorationComponent, {
        className,
        element,
        top,
        height
      });
    });
  }
}
