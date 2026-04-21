		constructor() {
			this.curPyramid = new jsfeat.pyramid_t(3);
			this.prevPyramid = new jsfeat.pyramid_t(3);
			this.curPyramid.allocate(cameraVideo.videoWidth, cameraVideo.videoHeight, jsfeat.U8C1_t);
			this.prevPyramid.allocate(cameraVideo.videoWidth, cameraVideo.videoHeight, jsfeat.U8C1_t);

			this.pointCount = 0;
			this.pointStatus = new Uint8Array(maxPoints);
			this.prevXY = new Float32Array(maxPoints * 2);
			this.curXY = new Float32Array(maxPoints * 2);
		}
