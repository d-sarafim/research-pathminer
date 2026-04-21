setHash(hash) {
  if (!this.pdfDocument) {
    return;
  }

  let pageNumber, dest;

  if (hash.includes("=")) {
    const params = (0, _ui_utils.parseQueryString)(hash);

    if ("search" in params) {
      this.eventBus.dispatch("findfromurlhash", {
        source: this,
        query: params.search.replace(/"/g, ""),
        phraseSearch: params.phrase === "true"
      });
    }

    if ("page" in params) {
      pageNumber = params.page | 0 || 1;
    }

    if ("zoom" in params) {
      const zoomArgs = params.zoom.split(",");
      const zoomArg = zoomArgs[0];
      const zoomArgNumber = parseFloat(zoomArg);

      if (!zoomArg.includes("Fit")) {
        dest = [null, {
          name: "XYZ"
        }, zoomArgs.length > 1 ? zoomArgs[1] | 0 : null, zoomArgs.length > 2 ? zoomArgs[2] | 0 : null, zoomArgNumber ? zoomArgNumber / 100 : zoomArg];
      } else {
        if (zoomArg === "Fit" || zoomArg === "FitB") {
          dest = [null, {
            name: zoomArg
          }];
        } else if (zoomArg === "FitH" || zoomArg === "FitBH" || zoomArg === "FitV" || zoomArg === "FitBV") {
          dest = [null, {
            name: zoomArg
          }, zoomArgs.length > 1 ? zoomArgs[1] | 0 : null];
        } else if (zoomArg === "FitR") {
          if (zoomArgs.length !== 5) {
            console.error('PDFLinkService.setHash: Not enough parameters for "FitR".');
          } else {
            dest = [null, {
              name: zoomArg
            }, zoomArgs[1] | 0, zoomArgs[2] | 0, zoomArgs[3] | 0, zoomArgs[4] | 0];
          }
        } else {
          console.error(`PDFLinkService.setHash: "${zoomArg}" is not ` + "a valid zoom value.");
        }
      }
    }

    if (dest) {
      this.pdfViewer.scrollPageIntoView({
        pageNumber: pageNumber || this.page,
        destArray: dest,
        allowNegativeOffset: true
      });
    } else if (pageNumber) {
      this.page = pageNumber;
    }

    if ("pagemode" in params) {
      this.eventBus.dispatch("pagemode", {
        source: this,
        mode: params.pagemode
      });
    }

    if ("nameddest" in params) {
      this.goToDestination(params.nameddest);
    }
  } else {
    dest = unescape(hash);

    try {
      dest = JSON.parse(dest);

      if (!Array.isArray(dest)) {
        dest = dest.toString();
      }
    } catch (ex) {}

    if (typeof dest === "string" || isValidExplicitDestination(dest)) {
      this.goToDestination(dest);
      return;
    }

    console.error(`PDFLinkService.setHash: "${unescape(hash)}" is not ` + "a valid destination.");
  }
}
