_isSupported(url) {
    const ext = path.getExtension(url);

    return supportedExtensions.indexOf(ext) > -1;
}
