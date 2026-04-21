delete() {
    if (this.map) {
        const renderer = this.map.getRenderer();
        if (renderer) {
            renderer.removeTopElement(this);
        }
    }
    resources.logout(this.url);
    if (this._dragger) {
        this._dragger.disable();
        delete this._dragger;
    }
    delete this.map;
}
