render() {
  const classList = ['atom-dock-toggle-button', this.props.location];
  if (this.props.visible) classList.push(TOGGLE_BUTTON_VISIBLE_CLASS);

  return $.div(
    { className: classList.join(' ') },
    $.div(
      {
        ref: 'innerElement',
        className: `atom-dock-toggle-button-inner ${this.props.location}`,
        on: {
          click: this.handleClick,
          dragenter: this.props.onDragEnter
        }
      },
      $.span({
        ref: 'iconElement',
        className: `icon ${getIconName(
          this.props.location,
          this.props.dockIsVisible
        )}`
      })
    )
  );
}
