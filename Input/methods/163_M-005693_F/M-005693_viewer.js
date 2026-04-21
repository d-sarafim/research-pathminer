_bindSpreadModeListener(buttons) {
  function spreadModeChanged({
    mode
  }) {
    buttons.spreadNoneButton.classList.toggle("toggled", mode === _ui_utils.SpreadMode.NONE);
    buttons.spreadOddButton.classList.toggle("toggled", mode === _ui_utils.SpreadMode.ODD);
    buttons.spreadEvenButton.classList.toggle("toggled", mode === _ui_utils.SpreadMode.EVEN);
  }

  this.eventBus._on("spreadmodechanged", spreadModeChanged);

  this.eventBus._on("secondarytoolbarreset", evt => {
    if (evt.source === this) {
      spreadModeChanged({
        mode: _ui_utils.SpreadMode.NONE
      });
    }
  });
}
