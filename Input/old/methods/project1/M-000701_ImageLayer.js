retireImage(image) {
    if (image.close) {
        image.close();
    }
    this.disposeImage(image);
}
