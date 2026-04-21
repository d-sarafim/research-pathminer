_getTiles(tileZoom, containerExtent, cascadeLevel, parentRenderer, ignoreMinZoom) {
    // rendWhenReady = false;
    const map = this.getMap();
    let z = tileZoom;
    let frustumMatrix = map.projViewMatrix;
    const canSplitTile = map.getResolution(tileZoom) / map.getResolution(tileZoom - 1) === 0.5;
    if (cascadeLevel < 2) {
        if (cascadeLevel === 0 && canSplitTile) {
            // cascadeLevel为0时，查询父级瓦片，再对父级瓦片split
            z -= 1;
        }
        frustumMatrix = cascadeLevel === 0 ? map.cascadeFrustumMatrix0 : cascadeLevel === 1 ? map.cascadeFrustumMatrix1 : map.projViewMatrix;
    }
    const zoom = z + this.options['zoomOffset'];
    const offset = this._getTileOffset(z),
        hasOffset = offset[0] || offset[1];
    const emptyGrid = {
        'zoom': z,
        'extent': null,
        'offset': offset,
        'tiles': []
    };
    if (zoom < 0) {
        return emptyGrid;
    }
    if (!map || !this.isVisible() || !map.width || !map.height) {
        return emptyGrid;
    }
    if (!ignoreMinZoom) {
        const minZoom = this.getMinZoom(),
            maxZoom = this.getMaxZoom();
        if (!isNil(minZoom) && z < minZoom ||
            !isNil(maxZoom) && z > maxZoom) {
            return emptyGrid;
        }
    }
    const tileConfig = this._getTileConfig();
    if (!tileConfig) {
        return emptyGrid;
    }
    //$$$
    const tileOffsets = {
        zoom: offset
    };
    const sr = this.getSpatialReference();
    const res = sr.getResolution(z);
    // const glScale = res / map.getGLRes();
    let glScale;
    if (this._hasOwnSR) {
        glScale = map.getGLScale(z);
    } else {
        glScale = res / map.getGLRes();
    }

    const repeatWorld = !this._hasOwnSR && this.options['repeatWorld'];

    const extent2d = this._convertToExtent2d(containerExtent);
    // const innerExtent2D = this._getInnerExtent(z, containerExtent, extent2d)._add(offset);
    // extent2d._add(offset);

    const maskExtent = this._getMask2DExtent();
    if (maskExtent) {
        const intersection = maskExtent.intersection(extent2d);
        if (!intersection) {
            return emptyGrid;
        }
        containerExtent = intersection.convertTo(c => map._pointToContainerPoint(c, undefined, 0, TEMP_POINT));
    }
    //Get description of center tile including left and top offset
    const prjCenter = map._containerPointToPrj(containerExtent.getCenter(), TEMP_POINT0);
    const centerPoint = map._prjToPoint(prjCenter, z, TEMP_POINT1);
    let c;
    if (hasOffset) {
        c = this._project(map._pointToPrj(centerPoint._add(offset), z, TEMP_POINT1), TEMP_POINT1);
    } else {
        c = this._project(prjCenter, TEMP_POINT1);
    }

    const extentScale = map.getGLScale() / map.getGLScale(z);
    TEMP_POINT2.x = extent2d.xmin * extentScale;
    TEMP_POINT2.y = extent2d.ymax * extentScale;
    TEMP_POINT3.x = extent2d.xmax * extentScale;
    TEMP_POINT3.y = extent2d.ymin * extentScale;
    const pmin = this._project(map._pointToPrj(TEMP_POINT2._add(offset), z, TEMP_POINT2), TEMP_POINT2);
    const pmax = this._project(map._pointToPrj(TEMP_POINT3._add(offset), z, TEMP_POINT3), TEMP_POINT3);

    const centerTile = tileConfig.getTileIndex(c, res, repeatWorld);
    const ltTile = tileConfig.getTileIndex(pmin, res, repeatWorld);
    const rbTile = tileConfig.getTileIndex(pmax, res, repeatWorld);

    // Number of tiles around the center tile
    const top = Math.ceil(Math.abs(centerTile.idy - ltTile.idy)),
        left = Math.ceil(Math.abs(centerTile.idx - ltTile.idx)),
        bottom = Math.ceil(Math.abs(centerTile.idy - rbTile.idy)),
        right = Math.ceil(Math.abs(centerTile.idx - rbTile.idx));
    const allCount = (top + bottom + 1) * (left + right + 1);
    const tileSize = this.getTileSize();
    const renderer = this.getRenderer() || parentRenderer,
        scale = this._getTileConfig().tileSystem.scale;
    const tiles = [], extent = new PointExtent();
    const tilePoint = new Point(0, 0);
    for (let i = -top; i <= bottom; i++) {
        let j = -left;
        let leftVisitEnd = -Infinity;
        let rightVisitEnd = false;
        while (j >= leftVisitEnd && j <= right) {
            const idx = tileConfig.getNeighorTileIndex(centerTile.idx, centerTile.idy, j, i, res, repeatWorld);
            if (leftVisitEnd === -Infinity) {
                //从左往右遍历中
                j++;
            } else {
                //从右往左遍历中
                j--;
            }
            const tileId = this._getTileId(idx.idx, idx.idy, z);
            if (idx.out || this._visitedTiles && this._visitedTiles.has(tileId)) {
                continue;
            }
            //unique id of the tile
            let tileInfo = renderer && renderer.isTileCachedOrLoading(tileId);
            if (tileInfo) {
                tileInfo = tileInfo.info;
            }

            let p;
            if (tileInfo) {
                const { extent2d } = tileInfo;
                tilePoint.set(extent2d.xmin, extent2d.ymax);
                p = tilePoint;
            } else if (!this._hasOwnSR) {
                p = tileConfig.getTilePointNW(idx.x, idx.y, res);
                // const pnw = tileConfig.getTilePrjNW(idx.x, idx.y, res);
                // p = map._prjToPoint(this._unproject(pnw, TEMP_POINT3), z);
            } else {
                const pnw = tileConfig.getTilePrjNW(idx.x, idx.y, res);
                p = map._prjToPoint(this._unproject(pnw, TEMP_POINT3), z);
            }

            let width, height;
            if (!this._hasOwnSR) {
                width = tileSize.width;
                height = tileSize.height;
            } else {
                let pp;
                if (!this._hasOwnSR) {
                    pp = tileConfig.getTilePointSE(idx.x, idx.y, res);
                } else {
                    const pse = tileConfig.getTilePrjSE(idx.x, idx.y, res);
                    pp = map._prjToPoint(this._unproject(pse, TEMP_POINT3), z, TEMP_POINT3);
                }
                width = Math.ceil(Math.abs(pp.x - p.x));
                height = Math.ceil(Math.abs(pp.y - p.y));
            }
            const dx = scale.x * (idx.idx - idx.x) * width,
                dy = scale.y * (idx.idy - idx.y) * height;
            if (!tileInfo && (dx || dy)) {
                p._add(dx, dy);
            }


            const tileExtent = tileInfo && tileInfo.extent2d || new PointExtent(p.x, p.y - height, p.x + width, p.y);
            // if (hasOffset) {
            //     tileExtent.set(p.x, p.y - height, p.x + width, p.y);
            // }
            if (allCount <= 4 || rightVisitEnd || this._isTileInExtent(frustumMatrix, tileExtent, offset, glScale)) {
                const tileRes = this._hasOwnSR ? map._getResolution(z) : res;
                if (this._visitedTiles && cascadeLevel === 0) {
                    this._visitedTiles.add(tileId);
                }
                if (canSplitTile && cascadeLevel === 0) {
                    this._splitTiles(frustumMatrix, tiles, renderer, idx, z + 1, tileRes, tileExtent, dx, dy, tileOffsets, parentRenderer);
                    extent._combine(tileExtent);
                } else {
                    if (!tileInfo) {
                        tileInfo = {
                            //reserve point caculated by tileConfig
                            //so add offset because we have p._sub(offset) and p._add(dx, dy) if hasOffset
                            'z': z,
                            'x': idx.x,
                            'y': idx.y,
                            'idx': idx.idx,
                            'idy': idx.idy,
                            'extent2d': tileExtent,
                            'offset': offset,
                            'id': tileId,
                            'res': tileRes,
                            'url': this.getTileUrl(idx.x, idx.y, zoom)
                        };
                        if (parentRenderer) {
                            tileInfo['layer'] = this.getId();
                        }
                    } else {
                        tileInfo.offset[0] = offset[0];
                        tileInfo.offset[1] = offset[1];
                    }

                    tiles.push(tileInfo);
                    extent._combine(tileExtent);
                }
                if (leftVisitEnd === -Infinity) {
                    //从左往右第一次遇到可视的瓦片，改为从右往左遍历
                    leftVisitEnd = j;
                    j = right;// - Math.max(j - -left - 4, 0);
                    // rightVisitEnd = true;
                } else if (!rightVisitEnd) {
                    //从右往左第一次遇到可视瓦片，之后的瓦片全部可视
                    rightVisitEnd = true;
                }
            }
        }
    }

    if (tiles.length) {
        //sort tiles according to tile's distance to center
        const center = map._containerPointToPoint(containerExtent.getCenter(), z, TEMP_POINT)._add(offset);
        const point0 = new Point(0, 0);
        const point1 = new Point(0, 0);
        tiles.sort(function (a, b) {
            point0.set((a.extent2d.xmin + a.extent2d.xmax) / 2, (a.extent2d.ymin + a.extent2d.ymax) / 2);
            point1.set((b.extent2d.xmin + b.extent2d.xmax) / 2, (b.extent2d.ymin + b.extent2d.ymax) / 2);
            return point0.distanceTo(center) - point1.distanceTo(center);
        });
    }
    return {
        'offset': offset,
        'zoom': tileZoom,
        'extent': extent,
        'tiles': tiles
    };
}
