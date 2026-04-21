_getPageAdvance(currentPageNumber, previous = false) {
  if (this.isInPresentationMode) {
    return 1;
  }

  switch (this._scrollMode) {
    case _ui_utils.ScrollMode.WRAPPED:
      {
        const {
          views
        } = this._getVisiblePages(),
              pageLayout = new Map();

        for (const {
          id,
          y,
          percent,
          widthPercent
        } of views) {
          if (percent === 0 || widthPercent < 100) {
            continue;
          }

          let yArray = pageLayout.get(y);

          if (!yArray) {
            pageLayout.set(y, yArray || (yArray = []));
          }

          yArray.push(id);
        }

        for (const yArray of pageLayout.values()) {
          const currentIndex = yArray.indexOf(currentPageNumber);

          if (currentIndex === -1) {
            continue;
          }

          const numPages = yArray.length;

          if (numPages === 1) {
            break;
          }

          if (previous) {
            for (let i = currentIndex - 1, ii = 0; i >= ii; i--) {
              const currentId = yArray[i],
                    expectedId = yArray[i + 1] - 1;

              if (currentId < expectedId) {
                return currentPageNumber - expectedId;
              }
            }
          } else {
            for (let i = currentIndex + 1, ii = numPages; i < ii; i++) {
              const currentId = yArray[i],
                    expectedId = yArray[i - 1] + 1;

              if (currentId > expectedId) {
                return expectedId - currentPageNumber;
              }
            }
          }

          if (previous) {
            const firstId = yArray[0];

            if (firstId < currentPageNumber) {
              return currentPageNumber - firstId + 1;
            }
          } else {
            const lastId = yArray[numPages - 1];

            if (lastId > currentPageNumber) {
              return lastId - currentPageNumber + 1;
            }
          }

          break;
        }

        break;
      }

    case _ui_utils.ScrollMode.HORIZONTAL:
      {
        break;
      }

    case _ui_utils.ScrollMode.VERTICAL:
      {
        if (this._spreadMode === _ui_utils.SpreadMode.NONE) {
          break;
        }

        const parity = this._spreadMode - 1;

        if (previous && currentPageNumber % 2 !== parity) {
          break;
        } else if (!previous && currentPageNumber % 2 === parity) {
          break;
        }

        const {
          views
        } = this._getVisiblePages(),
              expectedId = previous ? currentPageNumber - 1 : currentPageNumber + 1;

        for (const {
          id,
          percent,
          widthPercent
        } of views) {
          if (id !== expectedId) {
            continue;
          }

          if (percent > 0 && widthPercent === 100) {
            return 2;
          }

          break;
        }

        break;
      }
  }

  return 1;
}
