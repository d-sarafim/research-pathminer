_showUINotification() {
  this.l10n.get("toggle_sidebar_notification2.title").then(msg => {
    this.toggleButton.title = msg;
  });

  if (!this.isOpen) {
    this.toggleButton.classList.add(UI_NOTIFICATION_CLASS);
  }
}
