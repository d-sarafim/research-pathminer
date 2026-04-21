configure_(sources) {
  let extent;
  let origin;
  let commonRenderTileSizes;
  let commonSourceTileSizes;
  let resolutions;
  const samplesPerPixel = new Array(sources.length);
  const nodataValues = new Array(sources.length);
  const metadata = new Array(sources.length);
  let minZoom = 0;

  const sourceCount = sources.length;
  for (let sourceIndex = 0; sourceIndex < sourceCount; ++sourceIndex) {
    const images = [];
    const masks = [];
    sources[sourceIndex].forEach((item) => {
      if (isMask(item)) {
        masks.push(item);
      } else {
        images.push(item);
      }
    });

    const imageCount = images.length;
    if (masks.length > 0 && masks.length !== imageCount) {
      throw new Error(
        `Expected one mask per image found ${masks.length} masks and ${imageCount} images`
      );
    }

    let sourceExtent;
    let sourceOrigin;
    const sourceTileSizes = new Array(imageCount);
    const renderTileSizes = new Array(imageCount);
    const sourceResolutions = new Array(imageCount);

    nodataValues[sourceIndex] = new Array(imageCount);
    metadata[sourceIndex] = new Array(imageCount);

    for (let imageIndex = 0; imageIndex < imageCount; ++imageIndex) {
      const image = images[imageIndex];
      const nodataValue = image.getGDALNoData();
      metadata[sourceIndex][imageIndex] = image.getGDALMetadata(0);
      nodataValues[sourceIndex][imageIndex] = nodataValue;

      const wantedSamples = this.sourceInfo_[sourceIndex].bands;
      samplesPerPixel[sourceIndex] = wantedSamples
        ? wantedSamples.length
        : image.getSamplesPerPixel();
      const level = imageCount - (imageIndex + 1);

      if (!sourceExtent) {
        sourceExtent = getBoundingBox(image);
      }

      if (!sourceOrigin) {
        sourceOrigin = getOrigin(image);
      }

      const imageResolutions = getResolutions(image, images[0]);
      sourceResolutions[level] = imageResolutions[0];

      const sourceTileSize = [image.getTileWidth(), image.getTileHeight()];

      // request larger blocks for untiled layouts
      if (
        sourceTileSize[0] !== sourceTileSize[1] &&
        sourceTileSize[1] < defaultTileSize
      ) {
        sourceTileSize[0] = defaultTileSize;
        sourceTileSize[1] = defaultTileSize;
      }

      sourceTileSizes[level] = sourceTileSize;

      const aspectRatio = imageResolutions[0] / Math.abs(imageResolutions[1]);
      renderTileSizes[level] = [
        sourceTileSize[0],
        sourceTileSize[1] / aspectRatio,
      ];
    }

    if (!extent) {
      extent = sourceExtent;
    } else {
      getIntersection(extent, sourceExtent, extent);
    }

    if (!origin) {
      origin = sourceOrigin;
    } else {
      const message = `Origin mismatch for source ${sourceIndex}, got [${sourceOrigin}] but expected [${origin}]`;
      assertEqual(origin, sourceOrigin, 0, message, this.viewRejector);
    }

    if (!resolutions) {
      resolutions = sourceResolutions;
      this.resolutionFactors_[sourceIndex] = 1;
    } else {
      if (resolutions.length - minZoom > sourceResolutions.length) {
        minZoom = resolutions.length - sourceResolutions.length;
      }
      const resolutionFactor =
        resolutions[resolutions.length - 1] /
        sourceResolutions[sourceResolutions.length - 1];
      this.resolutionFactors_[sourceIndex] = resolutionFactor;
      const scaledSourceResolutions = sourceResolutions.map(
        (resolution) => (resolution *= resolutionFactor)
      );
      const message = `Resolution mismatch for source ${sourceIndex}, got [${scaledSourceResolutions}] but expected [${resolutions}]`;
      assertEqual(
        resolutions.slice(minZoom, resolutions.length),
        scaledSourceResolutions,
        0.02,
        message,
        this.viewRejector
      );
    }

    if (!commonRenderTileSizes) {
      commonRenderTileSizes = renderTileSizes;
    } else {
      assertEqual(
        commonRenderTileSizes.slice(minZoom, commonRenderTileSizes.length),
        renderTileSizes,
        0.01,
        `Tile size mismatch for source ${sourceIndex}`,
        this.viewRejector
      );
    }

    if (!commonSourceTileSizes) {
      commonSourceTileSizes = sourceTileSizes;
    } else {
      assertEqual(
        commonSourceTileSizes.slice(minZoom, commonSourceTileSizes.length),
        sourceTileSizes,
        0,
        `Tile size mismatch for source ${sourceIndex}`,
        this.viewRejector
      );
    }

    this.sourceImagery_[sourceIndex] = images.reverse();
    this.sourceMasks_[sourceIndex] = masks.reverse();
  }

  for (let i = 0, ii = this.sourceImagery_.length; i < ii; ++i) {
    const sourceImagery = this.sourceImagery_[i];
    while (sourceImagery.length < resolutions.length) {
      sourceImagery.unshift(undefined);
    }
  }

  if (!this.getProjection()) {
    this.determineProjection(sources);
  }

  this.samplesPerPixel_ = samplesPerPixel;
  this.nodataValues_ = nodataValues;
  this.metadata_ = metadata;

  // decide if we need to add an alpha band to handle nodata
  outer: for (let sourceIndex = 0; sourceIndex < sourceCount; ++sourceIndex) {
    // option 1: source is configured with a nodata value
    if (this.sourceInfo_[sourceIndex].nodata !== undefined) {
      this.addAlpha_ = true;
      break;
    }
    if (this.sourceMasks_[sourceIndex].length) {
      this.addAlpha_ = true;
      break;
    }

    const values = nodataValues[sourceIndex];

    // option 2: check image metadata for limited bands
    const bands = this.sourceInfo_[sourceIndex].bands;
    if (bands) {
      for (let i = 0; i < bands.length; ++i) {
        if (values[bands[i] - 1] !== null) {
          this.addAlpha_ = true;
          break outer;
        }
      }
      continue;
    }

    // option 3: check image metadata for all bands
    for (let imageIndex = 0; imageIndex < values.length; ++imageIndex) {
      if (values[imageIndex] !== null) {
        this.addAlpha_ = true;
        break outer;
      }
    }
  }

  let bandCount = this.addAlpha_ ? 1 : 0;
  for (let sourceIndex = 0; sourceIndex < sourceCount; ++sourceIndex) {
    bandCount += samplesPerPixel[sourceIndex];
  }
  this.bandCount = bandCount;

  const tileGrid = new TileGrid({
    extent: extent,
    minZoom: minZoom,
    origin: origin,
    resolutions: resolutions,
    tileSizes: commonRenderTileSizes,
  });

  this.tileGrid = tileGrid;
  this.setTileSizes(commonSourceTileSizes);

  this.setLoader(this.loadTile_.bind(this));
  this.setState('ready');

  const zoom = 1;
  if (resolutions.length === 2) {
    resolutions = [resolutions[0], resolutions[1], resolutions[1] / 2];
  } else if (resolutions.length === 1) {
    resolutions = [resolutions[0] * 2, resolutions[0], resolutions[0] / 2];
  }

  this.viewResolver({
    showFullExtent: true,
    projection: this.projection,
    resolutions: resolutions,
    center: toUserCoordinate(getCenter(extent), this.projection),
    extent: toUserExtent(extent, this.projection),
    zoom: zoom,
  });
}
