_getTilesInCurrentFrame() {
    const map = this.getMap();
    const layer = this.layer;
    let tileGrids = layer.getTiles();
    this._frameTileGrids = tileGrids;
    tileGrids = tileGrids.tileGrids;
    if (!tileGrids || !tileGrids.length) {
        return null;
    }
    const count = tileGrids.reduce((acc, curr) => acc + (curr && curr.tiles && curr.tiles.length || 0), 0);
    if (count >= (this.tileCache.max / 2)) {
        this.tileCache.setMaxSize(count * 2 + 1);
    }
    let loadingCount = 0;
    let loading = false;
    const checkedTiles = {};
    const tiles = [],
        parentTiles = [], parentKeys = {},
        childTiles = [], childKeys = {},
        placeholders = [], placeholderKeys = {};
    //visit all the tiles
    const tileQueue = {};
    const preLoadingCount = this._markTiles(),
        loadingLimit = this._getLoadLimit();

    const l = tileGrids.length;

    // main tile grid is the last one (draws on top)
    this._tileZoom = tileGrids[0]['zoom'];

    for (let i = 0; i < l; i++) {
        const tileGrid = tileGrids[i];
        const gridTiles = tileGrid['tiles'];
        const parents = tileGrid['parents'] || EMPTY_ARRAY;
        const parentCount = parents.length;
        const allTiles = parents.concat(gridTiles);

        let placeholder;
        if (allTiles.length) {
            placeholder = this._generatePlaceHolder(allTiles[0].res);
        }

        for (let j = 0, l = allTiles.length; j < l; j++) {
            const tile = allTiles[j];
            const tileId = tile['id'];
            const isParentTile = j < parentCount;
            //load tile in cache at first if it has.
            let tileLoading = false;
            if (this._isLoadingTile(tileId)) {
                tileLoading = loading = true;
                this.tilesLoading[tileId].current = true;
            } else {
                const cached = this._getCachedTile(tileId, isParentTile);
                if (cached) {
                    if (!isParentTile) {
                        if (cached.image && this.isTileFadingIn(cached.image)) {
                            tileLoading = loading = true;
                            this.setToRedraw();
                        }
                        tiles.push(cached);
                        if (!this.isTileComplete(cached)) {
                            tileLoading = true;
                        }
                    }
                } else {
                    tileLoading = loading = true;
                    const hitLimit = loadingLimit && (loadingCount + preLoadingCount[0]) > loadingLimit;
                    if (!hitLimit && (!map.isInteracting() || (map.isMoving() || map.isRotating()))) {
                        loadingCount++;
                        const key = tileId;
                        tileQueue[key] = tile;
                    }
                }
            }
            if (isParentTile) continue;
            if (!tileLoading) continue;
            if (checkedTiles[tileId]) continue;

            checkedTiles[tileId] = 1;
            if (placeholder && !placeholderKeys[tileId]) {
                //tell gl renderer not to bind gl buffer with image
                tile.cache = false;
                placeholders.push({
                    image: placeholder,
                    info: tile
                });

                placeholderKeys[tileId] = 1;
            }

            const children = this._findChildTiles(tile);
            if (children.length) {
                children.forEach(c => {
                    if (!childKeys[c.info.id]) {
                        childTiles.push(c);
                        childKeys[c.info.id] = 1;
                    }
                });
            }
            // (children.length !== 4) means it's not complete, we still need a parent tile
            if (!children.length || children.length !== 4) {
                const parentTile = this._findParentTile(tile);
                if (parentTile) {
                    const parentId = parentTile.info.id;
                    if (parentKeys[parentId] === undefined) {
                        parentKeys[parentId] = parentTiles.length;
                        parentTiles.push(parentTile);
                    }/* else {
                        //replace with parentTile of above tiles
                        parentTiles[parentKeys[parentId]] = parentTile;
                    } */
                }
            }
        }
    }

    this.tileCache.shrink();

    // if (parentTiles.length) {
    //     childTiles.length = 0;
    //     this._childTiles.length = 0;
    // }
    return {
        childTiles, parentTiles, tiles, placeholders, loading, loadingCount, tileQueue
    };
}
