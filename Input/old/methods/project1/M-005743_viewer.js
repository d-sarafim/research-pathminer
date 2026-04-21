openOrDownloadData(element, data, filename) {
  const isPdfData = (0, _pdfjsLib.isPdfFile)(filename);
  const contentType = isPdfData ? "application/pdf" : "";

  if (isPdfData && !_viewer_compatibility.viewerCompatibilityParams.disableCreateObjectURL) {
    let blobUrl = this._openBlobUrls.get(element);

    if (!blobUrl) {
      blobUrl = URL.createObjectURL(new Blob([data], {
        type: contentType
      }));

      this._openBlobUrls.set(element, blobUrl);
    }

    let viewerUrl;
    viewerUrl = "?file=" + encodeURIComponent(blobUrl + "#" + filename);

    try {
      window.open(viewerUrl);
      return true;
    } catch (ex) {
      console.error(`openOrDownloadData: ${ex}`);
      URL.revokeObjectURL(blobUrl);

      this._openBlobUrls.delete(element);
    }
  }

  this.downloadData(data, filename, contentType);
  return false;
}
