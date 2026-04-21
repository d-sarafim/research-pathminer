class HighlightComponent {
  constructor(props) {
    this.props = props;
    etch.initialize(this);
    if (this.props.flashRequested) this.performFlash();
  }

  destroy() {
    if (this.timeoutsByClassName) {
      this.timeoutsByClassName.forEach(timeout => {
        window.clearTimeout(timeout);
      });
      this.timeoutsByClassName.clear();
    }

    return etch.destroy(this);
  }

  update(newProps) {
    this.props = newProps;
    etch.updateSync(this);
    if (newProps.flashRequested) this.performFlash();
  }

  performFlash() {
    const { flashClass, flashDuration } = this.props;
    if (!this.timeoutsByClassName) this.timeoutsByClassName = new Map();

    // If a flash of this class is already in progress, clear it early and
    // flash again on the next frame to ensure CSS transitions apply to the
    // second flash.
    if (this.timeoutsByClassName.has(flashClass)) {
      window.clearTimeout(this.timeoutsByClassName.get(flashClass));
      this.timeoutsByClassName.delete(flashClass);
      this.element.classList.remove(flashClass);
      requestAnimationFrame(() => this.performFlash());
    } else {
      this.element.classList.add(flashClass);
      this.timeoutsByClassName.set(
        flashClass,
        window.setTimeout(() => {
          this.element.classList.remove(flashClass);
        }, flashDuration)
      );
    }
  }

  render() {
    const {
      className,
      screenRange,
      lineHeight,
      startPixelTop,
      startPixelLeft,
      endPixelTop,
      endPixelLeft
    } = this.props;
    const regionClassName = 'region ' + className;

    let children;
    if (screenRange.start.row === screenRange.end.row) {
      children = $.div({
        className: regionClassName,
        style: {
          position: 'absolute',
          boxSizing: 'border-box',
          top: startPixelTop + 'px',
          left: startPixelLeft + 'px',
          width: endPixelLeft - startPixelLeft + 'px',
          height: lineHeight + 'px'
        }
      });
    } else {
      children = [];
      children.push(
        $.div({
          className: regionClassName,
          style: {
            position: 'absolute',
            boxSizing: 'border-box',
            top: startPixelTop + 'px',
            left: startPixelLeft + 'px',
            right: 0,
            height: lineHeight + 'px'
          }
        })
      );

      if (screenRange.end.row - screenRange.start.row > 1) {
        children.push(
          $.div({
            className: regionClassName,
            style: {
              position: 'absolute',
              boxSizing: 'border-box',
              top: startPixelTop + lineHeight + 'px',
              left: 0,
              right: 0,
              height: endPixelTop - startPixelTop - lineHeight * 2 + 'px'
            }
          })
        );
      }

      if (endPixelLeft > 0) {
        children.push(
          $.div({
            className: regionClassName,
            style: {
              position: 'absolute',
              boxSizing: 'border-box',
              top: endPixelTop - lineHeight + 'px',
              left: 0,
              width: endPixelLeft + 'px',
              height: lineHeight + 'px'
            }
          })
        );
      }
    }

    return $.div({ className: 'highlight ' + className }, children);
  }
}
