set navMode(navMode) {
    navMode = navMode || "orbit";
    if (navMode !== "firstPerson" && navMode !== "orbit" && navMode !== "planView") {
        this.error("Unsupported value for navMode: " + navMode + " - supported values are 'orbit', 'firstPerson' and 'planView' - defaulting to 'orbit'");
        navMode = "orbit";
    }
    this._configs.firstPerson = (navMode === "firstPerson");
    this._configs.planView = (navMode === "planView");
    if (this._configs.firstPerson || this._configs.planView) {
        this._controllers.pivotController.hidePivot();
        this._controllers.pivotController.endPivot();
    }
    this._configs.navMode = navMode;
}
