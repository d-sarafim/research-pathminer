	instantiate(img_or_canvas) {
		this.$el.css({
			cursor: make_css_cursor("move", [8, 8], "move"),
			touchAction: "none",
		});
		this.position();

		const instantiate = () => {
			if (img_or_canvas) {
				// (this applies when pasting a selection)
				// NOTE: need to create a Canvas because something about imgs makes dragging not work with magnification
				// (width vs naturalWidth?)
				// and at least apply_image_transformation needs it to be a canvas now (and the property name says canvas anyways)
				this.source_canvas = make_canvas(img_or_canvas);
				// @TODO: is this width/height code needed? probably not! wouldn't it clear the canvas anyways?
				// but maybe we should assert in some way that the widths are the same, or resize the selection?
				if (this.source_canvas.width !== this.width) {
					this.source_canvas.width = this.width;
				}
				if (this.source_canvas.height !== this.height) {
					this.source_canvas.height = this.height;
				}
				this.canvas = make_canvas(this.source_canvas);
			}
			else {
				this.source_canvas = make_canvas(this.width, this.height);
				this.source_canvas.ctx.drawImage(main_canvas, this.x, this.y, this.width, this.height, 0, 0, this.width, this.height);
				this.canvas = make_canvas(this.source_canvas);
				this.cut_out_background();
			}
			this.$el.append(this.canvas);
			this.handles = new Handles({
				$handles_container: this.$el,
				$object_container: $canvas_area,
				outset: 2,
				get_rect: () => ({ x: this.x, y: this.y, width: this.width, height: this.height }),
				set_rect: ({ x, y, width, height }) => {
					undoable({
						name: "Resize Selection",
						icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
						soft: true,
					}, () => {
						this.x = x;
						this.y = y;
						this.width = width;
						this.height = height;
						this.position();
						this.resize();
					});
				},
				get_ghost_offset_left: () => parseFloat($canvas_area.css("padding-left")) + 1,
				get_ghost_offset_top: () => parseFloat($canvas_area.css("padding-top")) + 1,
			});
			let mox, moy;
			const pointermove = e => {
				make_or_update_undoable({
					match: (history_node) =>
						(e.shiftKey && history_node.name.match(/^(Smear|Stamp|Move) Selection$/)) ||
						(!e.shiftKey && history_node.name.match(/^Move Selection$/)),
					name: e.shiftKey ? "Smear Selection" : "Move Selection",
					update_name: true,
					icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
					soft: true,
				}, () => {
					const m = to_canvas_coords(e);
					this.x = Math.max(Math.min(m.x - mox, main_canvas.width), -this.width);
					this.y = Math.max(Math.min(m.y - moy, main_canvas.height), -this.height);
					this.position();
					if (e.shiftKey) {
						// Smear selection
						this.draw();
					}
				});
			};
			this.canvas_pointerdown = e => {
				e.preventDefault();
				const rect = this.canvas.getBoundingClientRect();
				const cx = e.clientX - rect.left;
				const cy = e.clientY - rect.top;
				mox = ~~(cx / rect.width * this.canvas.width);
				moy = ~~(cy / rect.height * this.canvas.height);
				$G.on("pointermove", pointermove);
				this.dragging = true;
				update_helper_layer(); // for thumbnail, which draws textbox outline if it's not being dragged
				$G.one("pointerup", () => {
					$G.off("pointermove", pointermove);
					this.dragging = false;
					update_helper_layer(); // for thumbnail, which draws selection outline if it's not being dragged
				});
				if (e.shiftKey) {
					// Stamp or start to smear selection
					undoable({
						name: "Stamp Selection",
						icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
						soft: true,
					}, () => {
						this.draw();
					});
				}
				// @TODO: how should this work for macOS? where ctrl+click = secondary click?
				else if (e.ctrlKey) {
					// Stamp selection
					undoable({
						name: "Stamp Selection",
						icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
						soft: true,
					}, () => {
						this.draw();
					});
				}
			};
			$(this.canvas).on("pointerdown", this.canvas_pointerdown);
			$canvas_area.trigger("resize");
			$status_position.text("");
			$status_size.text("");
		};

		instantiate();
	}
