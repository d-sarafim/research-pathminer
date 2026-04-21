_splitNode(node, projectionView, queue, tiles, gridExtent, maxZoom, offset, parentRenderer, glRes) {
    const zoomOffset = this.options['zoomOffset'];
    const tileSystem = this._getTileConfig().tileSystem;
    const scaleY = tileSystem.scale.y;
    const z = node.z + 1;
    const sr = this.getSpatialReference();
    const { x, y, extent2d, idx, idy } = node;
    const childScale = 2;
    const width = extent2d.getWidth() / 2 * childScale;
    const height = extent2d.getHeight() / 2 * childScale;
    const minx = extent2d.xmin * childScale;
    const maxy = extent2d.ymax * childScale;
    const miny = extent2d.ymin * childScale;

    const renderer = parentRenderer || this.getRenderer();

    let hasCurrentIn = false;
    const children = [];
    const res = sr.getResolution(z);
    const glScale = res / glRes;
    for (let i = 0; i < 4; i++) {
        const dx = (i % 2);
        const dy = (i >> 1);
        const childX = (x << 1) + dx;
        const childY = (y << 1) + dy;
        const childIdx = (idx << 1) + dx;
        const childIdy = (idy << 1) + dy;

        // const tileId = this._getTileId(childIdx, childIdy, z);
        if (!node.children) {
            node.children = [];
        }
        let tileId = node.children[i];
        if (!tileId) {
            tileId = this._getTileId(childIdx, childIdy, z);
            node.children[i] = tileId;
        }
        const cached = renderer.isTileCachedOrLoading(tileId);
        let extent;
        let childNode = cached && cached.info;
        if (!childNode) {
            if (!this.tileInfoCache) {
                this.tileInfoCache = new LRUCache(this.options['maxCacheSize'] * 4);
            }
            childNode = this.tileInfoCache.get(tileId);
            if (!childNode) {
                if (scaleY < 0) {
                    const nwx = minx + dx * width;
                    const nwy = maxy - dy * height;
                    // extent2d 是 node.z 级别上的 extent
                    extent = new PointExtent(nwx, nwy - height, nwx + width, nwy);

                } else {
                    const swx = minx + dx * width;
                    const swy = miny + dy * height;
                    extent = new PointExtent(swx, swy, swx + width, swy + height);
                }
                childNode = {
                    x: childX,
                    y: childY,
                    idx: childIdx,
                    idy: childIdy,
                    z,
                    extent2d: extent,
                    error: node.error / 2,
                    res,
                    id: tileId,
                    children: [],
                    url: this.getTileUrl(childX, childY, z + zoomOffset),
                    offset
                };
                this.tileInfoCache.add(tileId, childNode);
            }
            if (parentRenderer) {
                childNode['layer'] = this.getId();
            }
        }
        childNode.error = node.error / 2;
        childNode.offset[0] = offset[0];
        childNode.offset[1] = offset[1];
        const visible = this._isTileVisible(childNode, projectionView, glScale, maxZoom, offset);
        if (visible === 1) {
            hasCurrentIn = true;
        } else if (visible === -1) {
            continue;
        } else if (visible === 0 && z !== maxZoom) {
            // 任意子瓦片的error低于maxError，则添加父级瓦片，不再遍历子瓦片
            tiles.push(node);
            gridExtent._combine(node.extent2d);
            return;
        }
        children.push(childNode);
    }
    if (z === maxZoom) {
        if (hasCurrentIn) {
            queue.push(...children);
        } else {
            tiles.push(node);
            gridExtent._combine(node.extent2d);
        }
    } else {
        queue.push(...children);
    }


}
