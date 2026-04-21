class HighlightsComponent {
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

  destroy() {
    this.highlightComponentsByKey.forEach(highlightComponent => {
      highlightComponent.destroy();
    });
    this.highlightComponentsByKey.clear();
  }

  update(newProps) {
    if (this.shouldUpdate(newProps)) {
      this.props = newProps;
      const { height, width, lineHeight, highlightDecorations } = this.props;

      this.element.style.height = height + 'px';
      this.element.style.width = width + 'px';

      const visibleHighlightDecorations = new Set();
      if (highlightDecorations) {
        for (let i = 0; i < highlightDecorations.length; i++) {
          const highlightDecoration = highlightDecorations[i];
          const highlightProps = Object.assign(
            { lineHeight },
            highlightDecorations[i]
          );

          let highlightComponent = this.highlightComponentsByKey.get(
            highlightDecoration.key
          );
          if (highlightComponent) {
            highlightComponent.update(highlightProps);
          } else {
            highlightComponent = new HighlightComponent(highlightProps);
            this.element.appendChild(highlightComponent.element);
            this.highlightComponentsByKey.set(
              highlightDecoration.key,
              highlightComponent
            );
          }

          highlightDecorations[i].flashRequested = false;
          visibleHighlightDecorations.add(highlightDecoration.key);
        }
      }

      this.highlightComponentsByKey.forEach((highlightComponent, key) => {
        if (!visibleHighlightDecorations.has(key)) {
          highlightComponent.destroy();
          this.highlightComponentsByKey.delete(key);
        }
      });
    }
  }

  shouldUpdate(newProps) {
    const oldProps = this.props;

    if (!newProps.hasInitialMeasurements) return false;

    if (oldProps.width !== newProps.width) return true;
    if (oldProps.height !== newProps.height) return true;
    if (oldProps.lineHeight !== newProps.lineHeight) return true;
    if (!oldProps.highlightDecorations && newProps.highlightDecorations)
      return true;
    if (oldProps.highlightDecorations && !newProps.highlightDecorations)
      return true;
    if (oldProps.highlightDecorations && newProps.highlightDecorations) {
      if (
        oldProps.highlightDecorations.length !==
        newProps.highlightDecorations.length
      )
        return true;

      for (
        let i = 0, length = oldProps.highlightDecorations.length;
        i < length;
        i++
      ) {
        const oldHighlight = oldProps.highlightDecorations[i];
        const newHighlight = newProps.highlightDecorations[i];
        if (oldHighlight.className !== newHighlight.className) return true;
        if (newHighlight.flashRequested) return true;
        if (oldHighlight.startPixelTop !== newHighlight.startPixelTop)
          return true;
        if (oldHighlight.startPixelLeft !== newHighlight.startPixelLeft)
          return true;
        if (oldHighlight.endPixelTop !== newHighlight.endPixelTop) return true;
        if (oldHighlight.endPixelLeft !== newHighlight.endPixelLeft)
          return true;
        if (!oldHighlight.screenRange.isEqual(newHighlight.screenRange))
          return true;
      }
    }
  }
}
