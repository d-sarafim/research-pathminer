	cut_out_background() {
		const cutout = this.canvas;
		// doc/this or canvas/cutout, either of those pairs would result in variable names of equal length which is nice :)
		const canvasImageData = main_ctx.getImageData(this.x, this.y, this.width, this.height);
		const cutoutImageData = cutout.ctx.getImageData(0, 0, this.width, this.height);
		// cutoutImageData is initialized with the shape to be cut out (whether rectangular or polygonal)
		// and should end up as the cut out image data for the selection
		// canvasImageData is initially the portion of image data on the canvas,
		// and should end up as... the portion of image data on the canvas that it should end up as.
		// @TODO: could simplify by making the later (shared) condition just if (colored_cutout)
		// but might change how it works anyways so whatever
		// if (!transparency) { // now if !transparency or if tool_transparent_mode
		// this is mainly in order to support patterns as the background color
		// NOTE: must come before cutout canvas is modified
		const colored_cutout = make_canvas(cutout);
		replace_colors_with_swatch(colored_cutout.ctx, selected_colors.background, this.x, this.y);
		// const colored_cutout_image_data = colored_cutout.ctx.getImageData(0, 0, this.width, this.height);
		// }
		for (let i = 0; i < cutoutImageData.data.length; i += 4) {
			const in_cutout = cutoutImageData.data[i + 3] > 0;
			if (in_cutout) {
				cutoutImageData.data[i + 0] = canvasImageData.data[i + 0];
				cutoutImageData.data[i + 1] = canvasImageData.data[i + 1];
				cutoutImageData.data[i + 2] = canvasImageData.data[i + 2];
				cutoutImageData.data[i + 3] = canvasImageData.data[i + 3];
				canvasImageData.data[i + 0] = 0;
				canvasImageData.data[i + 1] = 0;
				canvasImageData.data[i + 2] = 0;
				canvasImageData.data[i + 3] = 0;
			}
			else {
				cutoutImageData.data[i + 0] = 0;
				cutoutImageData.data[i + 1] = 0;
				cutoutImageData.data[i + 2] = 0;
				cutoutImageData.data[i + 3] = 0;
			}
		}
		main_ctx.putImageData(canvasImageData, this.x, this.y);
		cutout.ctx.putImageData(cutoutImageData, 0, 0);
		this.update_tool_transparent_mode();
		// NOTE: in case you want to use the tool_transparent_mode
		// in a document with transparency (for an operation in an area where there's a local background color)
		// (and since currently switching to the opaque document mode makes the image opaque)
		// (and it would be complicated to make it update the canvas when switching tool options (as opposed to just the selection))
		// I'm having it use the tool_transparent_mode option here, so you could at least choose beforehand
		// (and this might actually give you more options, although it could be confusingly inconsistent)
		// @FIXME: yeah, this is confusing; if you have both transparency modes on and you try to clear an area to transparency, it doesn't work
		// and there's no indication that you should try the other selection transparency mode,
		// and even if you do, if you do it after creating a selection, it still won't work,
		// because you will have already *not cut out* the selection from the canvas
		if (!transparency || tool_transparent_mode) {
			main_ctx.drawImage(colored_cutout, this.x, this.y);
		}

		$G.triggerHandler("session-update"); // autosave
		update_helper_layer();
	}
