addQuad_(a, b, c, d, aSrc, bSrc, cSrc, dSrc, maxSubdivision) {
  const sourceQuadExtent = boundingExtent([aSrc, bSrc, cSrc, dSrc]);
  const sourceCoverageX = this.sourceWorldWidth_
    ? getWidth(sourceQuadExtent) / this.sourceWorldWidth_
    : null;
  const sourceWorldWidth = /** @type {number} */ (this.sourceWorldWidth_);

  // when the quad is wrapped in the source projection
  // it covers most of the projection extent, but not fully
  const wrapsX =
    this.sourceProj_.canWrapX() &&
    sourceCoverageX > 0.5 &&
    sourceCoverageX < 1;

  let needsSubdivision = false;

  if (maxSubdivision > 0) {
    if (this.targetProj_.isGlobal() && this.targetWorldWidth_) {
      const targetQuadExtent = boundingExtent([a, b, c, d]);
      const targetCoverageX =
        getWidth(targetQuadExtent) / this.targetWorldWidth_;
      needsSubdivision =
        targetCoverageX > MAX_TRIANGLE_WIDTH || needsSubdivision;
    }
    if (!wrapsX && this.sourceProj_.isGlobal() && sourceCoverageX) {
      needsSubdivision =
        sourceCoverageX > MAX_TRIANGLE_WIDTH || needsSubdivision;
    }
  }

  if (!needsSubdivision && this.maxSourceExtent_) {
    if (
      isFinite(sourceQuadExtent[0]) &&
      isFinite(sourceQuadExtent[1]) &&
      isFinite(sourceQuadExtent[2]) &&
      isFinite(sourceQuadExtent[3])
    ) {
      if (!intersects(sourceQuadExtent, this.maxSourceExtent_)) {
        // whole quad outside source projection extent -> ignore
        return;
      }
    }
  }

  let isNotFinite = 0;

  if (!needsSubdivision) {
    if (
      !isFinite(aSrc[0]) ||
      !isFinite(aSrc[1]) ||
      !isFinite(bSrc[0]) ||
      !isFinite(bSrc[1]) ||
      !isFinite(cSrc[0]) ||
      !isFinite(cSrc[1]) ||
      !isFinite(dSrc[0]) ||
      !isFinite(dSrc[1])
    ) {
      if (maxSubdivision > 0) {
        needsSubdivision = true;
      } else {
        // It might be the case that only 1 of the points is infinite. In this case
        // we can draw a single triangle with the other three points
        isNotFinite =
          (!isFinite(aSrc[0]) || !isFinite(aSrc[1]) ? 8 : 0) +
          (!isFinite(bSrc[0]) || !isFinite(bSrc[1]) ? 4 : 0) +
          (!isFinite(cSrc[0]) || !isFinite(cSrc[1]) ? 2 : 0) +
          (!isFinite(dSrc[0]) || !isFinite(dSrc[1]) ? 1 : 0);
        if (
          isNotFinite != 1 &&
          isNotFinite != 2 &&
          isNotFinite != 4 &&
          isNotFinite != 8
        ) {
          return;
        }
      }
    }
  }

  if (maxSubdivision > 0) {
    if (!needsSubdivision) {
      const center = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
      const centerSrc = this.transformInv_(center);

      let dx;
      if (wrapsX) {
        const centerSrcEstimX =
          (modulo(aSrc[0], sourceWorldWidth) +
            modulo(cSrc[0], sourceWorldWidth)) /
          2;
        dx = centerSrcEstimX - modulo(centerSrc[0], sourceWorldWidth);
      } else {
        dx = (aSrc[0] + cSrc[0]) / 2 - centerSrc[0];
      }
      const dy = (aSrc[1] + cSrc[1]) / 2 - centerSrc[1];
      const centerSrcErrorSquared = dx * dx + dy * dy;
      needsSubdivision = centerSrcErrorSquared > this.errorThresholdSquared_;
    }
    if (needsSubdivision) {
      if (Math.abs(a[0] - c[0]) <= Math.abs(a[1] - c[1])) {
        // split horizontally (top & bottom)
        const bc = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
        const bcSrc = this.transformInv_(bc);
        const da = [(d[0] + a[0]) / 2, (d[1] + a[1]) / 2];
        const daSrc = this.transformInv_(da);

        this.addQuad_(
          a,
          b,
          bc,
          da,
          aSrc,
          bSrc,
          bcSrc,
          daSrc,
          maxSubdivision - 1
        );
        this.addQuad_(
          da,
          bc,
          c,
          d,
          daSrc,
          bcSrc,
          cSrc,
          dSrc,
          maxSubdivision - 1
        );
      } else {
        // split vertically (left & right)
        const ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const abSrc = this.transformInv_(ab);
        const cd = [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2];
        const cdSrc = this.transformInv_(cd);

        this.addQuad_(
          a,
          ab,
          cd,
          d,
          aSrc,
          abSrc,
          cdSrc,
          dSrc,
          maxSubdivision - 1
        );
        this.addQuad_(
          ab,
          b,
          c,
          cd,
          abSrc,
          bSrc,
          cSrc,
          cdSrc,
          maxSubdivision - 1
        );
      }
      return;
    }
  }

  if (wrapsX) {
    if (!this.canWrapXInSource_) {
      return;
    }
    this.wrapsXInSource_ = true;
  }

  // Exactly zero or one of *Src is not finite
  // The triangles must have the diagonal line as the first side
  // This is to allow easy code in reproj.s to make it straight for broken
  // browsers that can't handle diagonal clipping
  if ((isNotFinite & 0xb) == 0) {
    this.addTriangle_(a, c, d, aSrc, cSrc, dSrc);
  }
  if ((isNotFinite & 0xe) == 0) {
    this.addTriangle_(a, c, b, aSrc, cSrc, bSrc);
  }
  if (isNotFinite) {
    // Try the other two triangles
    if ((isNotFinite & 0xd) == 0) {
      this.addTriangle_(b, d, a, bSrc, dSrc, aSrc);
    }
    if ((isNotFinite & 0x7) == 0) {
      this.addTriangle_(b, d, c, bSrc, dSrc, cSrc);
    }
  }
}
