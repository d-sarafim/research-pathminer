_addEventListeners() {
  this.viewerContainer.addEventListener("transitionend", evt => {
    if (evt.target === this.viewerContainer) {
      this.outerContainer.classList.remove("sidebarMoving");
    }
  });
  this.toggleButton.addEventListener("click", () => {
    this.toggle();
  });
  this.thumbnailButton.addEventListener("click", () => {
    this.switchView(_ui_utils.SidebarView.THUMBS);
  });
  this.outlineButton.addEventListener("click", () => {
    this.switchView(_ui_utils.SidebarView.OUTLINE);
  });
  this.outlineButton.addEventListener("dblclick", () => {
    this.eventBus.dispatch("toggleoutlinetree", {
      source: this
    });
  });
  this.attachmentsButton.addEventListener("click", () => {
    this.switchView(_ui_utils.SidebarView.ATTACHMENTS);
  });
  this.layersButton.addEventListener("click", () => {
    this.switchView(_ui_utils.SidebarView.LAYERS);
  });
  this.layersButton.addEventListener("dblclick", () => {
    this.eventBus.dispatch("resetlayers", {
      source: this
    });
  });

  this._currentOutlineItemButton.addEventListener("click", () => {
    this.eventBus.dispatch("currentoutlineitem", {
      source: this
    });
  });

  const onTreeLoaded = (count, button, view) => {
    button.disabled = !count;

    if (count) {
      this._showUINotification();
    } else if (this.active === view) {
      this.switchView(_ui_utils.SidebarView.THUMBS);
    }
  };

  this.eventBus._on("outlineloaded", evt => {
    onTreeLoaded(evt.outlineCount, this.outlineButton, _ui_utils.SidebarView.OUTLINE);

    if (evt.enableCurrentOutlineItemButton) {
      this.pdfViewer.pagesPromise.then(() => {
        this._currentOutlineItemButton.disabled = !this.isInitialViewSet;
      });
    }
  });

  this.eventBus._on("attachmentsloaded", evt => {
    onTreeLoaded(evt.attachmentsCount, this.attachmentsButton, _ui_utils.SidebarView.ATTACHMENTS);
  });

  this.eventBus._on("layersloaded", evt => {
    onTreeLoaded(evt.layersCount, this.layersButton, _ui_utils.SidebarView.LAYERS);
  });

  this.eventBus._on("presentationmodechanged", evt => {
    if (evt.state === _ui_utils.PresentationModeState.NORMAL && this.isThumbnailViewVisible) {
      this._updateThumbnailViewer();
    }
  });
}
