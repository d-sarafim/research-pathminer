composeTile_(sourceTileSize, sourceSamples) {
  const metadata = this.metadata_;
  const sourceInfo = this.sourceInfo_;
  const sourceCount = this.sourceImagery_.length;
  const bandCount = this.bandCount;
  const samplesPerPixel = this.samplesPerPixel_;
  const nodataValues = this.nodataValues_;
  const normalize = this.normalize_;
  const addAlpha = this.addAlpha_;

  const pixelCount = sourceTileSize[0] * sourceTileSize[1];
  const dataLength = pixelCount * bandCount;

  /** @type {Uint8Array|Float32Array} */
  let data;
  if (normalize) {
    data = new Uint8Array(dataLength);
  } else {
    data = new Float32Array(dataLength);
  }

  let dataIndex = 0;
  for (let pixelIndex = 0; pixelIndex < pixelCount; ++pixelIndex) {
    let transparent = addAlpha;
    for (let sourceIndex = 0; sourceIndex < sourceCount; ++sourceIndex) {
      const source = sourceInfo[sourceIndex];

      let min = source.min;
      let max = source.max;
      let gain, bias;
      if (normalize) {
        const stats = metadata[sourceIndex][0];
        if (min === undefined) {
          if (stats && STATISTICS_MINIMUM in stats) {
            min = parseFloat(stats[STATISTICS_MINIMUM]);
          } else {
            min = getMinForDataType(sourceSamples[sourceIndex][0]);
          }
        }
        if (max === undefined) {
          if (stats && STATISTICS_MAXIMUM in stats) {
            max = parseFloat(stats[STATISTICS_MAXIMUM]);
          } else {
            max = getMaxForDataType(sourceSamples[sourceIndex][0]);
          }
        }

        gain = 255 / (max - min);
        bias = -min * gain;
      }

      for (
        let sampleIndex = 0;
        sampleIndex < samplesPerPixel[sourceIndex];
        ++sampleIndex
      ) {
        const sourceValue =
          sourceSamples[sourceIndex][sampleIndex][pixelIndex];

        let value;
        if (normalize) {
          value = clamp(gain * sourceValue + bias, 0, 255);
        } else {
          value = sourceValue;
        }

        if (!addAlpha) {
          data[dataIndex] = value;
        } else {
          let nodata = source.nodata;
          if (nodata === undefined) {
            let bandIndex;
            if (source.bands) {
              bandIndex = source.bands[sampleIndex] - 1;
            } else {
              bandIndex = sampleIndex;
            }
            nodata = nodataValues[sourceIndex][bandIndex];
          }

          const nodataIsNaN = isNaN(nodata);
          if (
            (!nodataIsNaN && sourceValue !== nodata) ||
            (nodataIsNaN && !isNaN(sourceValue))
          ) {
            transparent = false;
            data[dataIndex] = value;
          }
        }
        dataIndex++;
      }
      if (!transparent) {
        const maskIndex = sourceCount + sourceIndex;
        const mask = sourceSamples[maskIndex];
        if (mask && !mask[0][pixelIndex]) {
          transparent = true;
        }
      }
    }
    if (addAlpha) {
      if (!transparent) {
        data[dataIndex] = 255;
      }
      dataIndex++;
    }
  }

  return data;
}
