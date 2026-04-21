	class MultiUserSession {
		constructor(session_id) {
			this.id = session_id;
			this._fb_listeners = [];

			file_name = `[Loading ${this.id}]`;
			update_title();
			const on_firebase_loaded = () => {
				file_name = `[${this.id}]`;
				update_title();
				this.start();
			};
			if (!MultiUserSession.fb_root) {
				var script = document.createElement("script");
				script.addEventListener("load", () => {
					const config = {
						apiKey: "AIzaSyBgau8Vu9ZE8u_j0rp-Lc044gYTX5O3X9k",
						authDomain: "jspaint.firebaseapp.com",
						databaseURL: "https://jspaint.firebaseio.com",
						projectId: "firebase-jspaint",
						storageBucket: "",
						messagingSenderId: "63395010995"
					};
					firebase.initializeApp(config);
					MultiUserSession.fb_root = firebase.database().ref("/");
					on_firebase_loaded();
				});
				script.addEventListener("error", () => {
					show_error_message("Failed to load Firebase; the document will not load, and changes will not be saved.");
					file_name = `[Failed to load ${this.id}]`;
					update_title();
				});
				script.src = "lib/firebase.js";
				document.head.appendChild(script);
			}
			else {
				on_firebase_loaded();
			}
		}
		start() {
			// @TODO: how do you actually detect if it's failing???
			showMessageBox({
				messageHTML: `
					<p>The document may not load. Changes may not save.</p>
					<p>Multiuser sessions are public. There is no security.</p>
				`
			});
			// "<p>The document may not load. Changes may not save. If it does save, it's public. There is no security.</p>"// +
			// "<p>I haven't found a way to detect Firebase quota limits being exceeded, " +
			// "so for now I'm showing this message regardless of whether it's working.</p>" +
			// "<p>If you're interested in using multiuser mode, please thumbs-up " +
			// "<a href='https://github.com/1j01/jspaint/issues/68'>this issue</a> to show interest, and/or subscribe for updates.</p>"

			// Wrap the Firebase API because they don't
			// provide a great way to clean up event listeners
			const _fb_on = (fb, event_type, callback, error_callback) => {
				this._fb_listeners.push({ fb, event_type, callback, error_callback });
				fb.on(event_type, callback, error_callback);
			};
			// Get Firebase references
			this.fb = MultiUserSession.fb_root.child(this.id);
			this.fb_data = this.fb.child("data");
			this.fb_users = this.fb.child("users");
			if (user_id) {
				this.fb_user = this.fb_users.child(user_id);
			}
			else {
				this.fb_user = this.fb_users.push();
				user_id = this.fb_user.key;
			}
			// Remove the user from the session when they disconnect
			this.fb_user.onDisconnect().remove();
			// Make the user present in the session
			this.fb_user.set(user);
			// @TODO: Execute the above two lines when .info/connected
			// For each existing and new user
			_fb_on(this.fb_users, "child_added", snap => {
				// Is this you?
				if (snap.key === user_id) {
					// You already have a cursor.
					return;
				}
				// Get the Firebase reference for this user
				const fb_other_user = snap.ref;
				// Get the user object stored on the server
				let other_user = snap.val();
				// @TODO: display other cursor types?
				// @TODO: display pointer button state?
				// @TODO: display selections
				const cursor_canvas = make_canvas(32, 32);
				// Make the cursor element
				const $cursor = $(cursor_canvas).addClass("user-cursor").appendTo($app);
				$cursor.css({
					display: "none",
					position: "absolute",
					left: 0,
					top: 0,
					opacity: 0,
					zIndex: 5, // @#: z-index
					pointerEvents: "none",
					transition: "opacity 0.5s",
				});
				// When the cursor data changes
				_fb_on(fb_other_user, "value", snap => {
					other_user = snap.val();
					// If the user has left
					if (other_user == null) {
						// Remove the cursor element
						$cursor.remove();
					}
					else {
						// Draw the cursor
						const draw_cursor = () => {
							cursor_canvas.width = cursor_image.width;
							cursor_canvas.height = cursor_image.height;
							const cursor_ctx = cursor_canvas.ctx;
							cursor_ctx.fillStyle = other_user.color;
							cursor_ctx.fillRect(0, 0, cursor_canvas.width, cursor_canvas.height);
							cursor_ctx.globalCompositeOperation = "multiply";
							cursor_ctx.drawImage(cursor_image, 0, 0);
							cursor_ctx.globalCompositeOperation = "destination-atop";
							cursor_ctx.drawImage(cursor_image, 0, 0);
						};
						if (cursor_image.complete) {
							draw_cursor();
						}
						else {
							$(cursor_image).one("load", draw_cursor);
						}
						// Update the cursor element
						const canvas_rect = canvas_bounding_client_rect;
						$cursor.css({
							display: "block",
							position: "absolute",
							left: canvas_rect.left + magnification * other_user.cursor.x,
							top: canvas_rect.top + magnification * other_user.cursor.y,
							opacity: 1 - other_user.cursor.away,
						});
					}
				});
			});
			let previous_uri;
			// let pointer_operations = []; // the multiplayer syncing stuff is a can of worms, so this is disabled
			this.write_canvas_to_database_immediately = () => {
				const save_paused = handle_data_loss();
				if (save_paused) {
					return;
				}
				// Sync the data from this client to the server (one-way)
				const uri = main_canvas.toDataURL();
				if (previous_uri !== uri) {
					// log("clear pointer operations to set data", pointer_operations);
					// pointer_operations = [];
					log("Write canvas data to Firebase");
					this.fb_data.set(uri);
					previous_uri = uri;
				}
				else {
					log("(Don't write canvas data to Firebase; it hasn't changed)");
				}
			};
			this.write_canvas_to_database_soon = debounce(this.write_canvas_to_database_immediately, 100);
			let ignore_session_update = false;
			$G.on("session-update.session-hook", () => {
				if (ignore_session_update) {
					log("(Ignore session-update from Sync Session undoable)");
					return;
				}
				this.write_canvas_to_database_soon();
			});
			// Any time we change or receive the image data
			_fb_on(this.fb_data, "value", snap => {
				log("Firebase data update");
				const uri = snap.val();
				if (uri == null) {
					// If there's no value at the data location, this is a new session
					// Sync the current data to it
					this.write_canvas_to_database_soon();
				}
				else {
					previous_uri = uri;
					// Load the new image data
					const img = new Image();
					img.onload = () => {
						// Cancel any in-progress pointer operations
						// if (pointer_operations.length) {
						// 	$G.triggerHandler("pointerup", "cancel");
						// }

						const test_canvas = make_canvas(img);
						const image_data_remote = test_canvas.ctx.getImageData(0, 0, test_canvas.width, test_canvas.height);
						const image_data_local = main_ctx.getImageData(0, 0, main_canvas.width, main_canvas.height);

						if (!image_data_match(image_data_remote, image_data_local, 5)) {
							ignore_session_update = true;
							undoable({
								name: "Sync Session",
								icon: get_help_folder_icon("p_database.png"),
							}, () => {
								// Write the image data to the canvas
								main_ctx.copy(img);
								$canvas_area.trigger("resize");
							});
							ignore_session_update = false;
						}

						// (transparency = has_any_transparency(main_ctx); here would not be ideal
						// Perhaps a better way of syncing transparency
						// and other options will be established)
						/*
						// Playback recorded in-progress pointer operations
						log("Playback", pointer_operations);

						for (const e of pointer_operations) {
							// Trigger the event at each place it is listened for
							$canvas.triggerHandler(e, ["synthetic"]);
							$G.triggerHandler(e, ["synthetic"]);
						}
						*/
					};
					img.src = uri;
				}
			}, error => {
				show_error_message("Failed to retrieve data from Firebase. The document will not load, and changes will not be saved.", error);
				file_name = `[Failed to load ${this.id}]`;
				update_title();
			});
			// Update the cursor status
			$G.on("pointermove.session-hook", e => {
				const m = to_canvas_coords(e);
				this.fb_user.child("cursor").update({
					x: m.x,
					y: m.y,
					away: false,
				});
			});
			$G.on("blur.session-hook", () => {
				this.fb_user.child("cursor").update({
					away: true,
				});
			});
			// @FIXME: the cursor can come back from "away" via a pointer event
			// while the window is blurred and stay there when the user goes away
			// maybe replace "away" with a timestamp of activity and then
			// clients can decide whether a given cursor should be visible

			/*
			const debug_event = (e, synthetic) => {
				// const label = synthetic ? "(synthetic)" : "(normal)";
				// window.console && console.debug && console.debug(e.type, label);
			};

			$canvas_area.on("pointerdown.session-hook", "*", (e, synthetic) => {
				debug_event(e, synthetic);
				if (synthetic) { return; }

				pointer_operations = [e];
				const pointermove = (e, synthetic) => {
					debug_event(e, synthetic);
					if (synthetic) { return; }

					pointer_operations.push(e);
				};
				$G.on("pointermove.session-hook", pointermove);
				$G.one("pointerup.session-hook", (e, synthetic) => {
					debug_event(e, synthetic);
					if (synthetic) { return; }

					$G.off("pointermove.session-hook", pointermove);
				});
			});
			*/
		}
		end() {
			// Skip debounce and save immediately
			this.write_canvas_to_database_soon.cancel();
			this.write_canvas_to_database_immediately();
			// Remove session-related hooks
			$G.off(".session-hook");
			// $canvas_area.off("pointerdown.session-hook");
			// Remove collected Firebase event listeners
			this._fb_listeners.forEach(({ fb, event_type, callback/*, error_callback*/ }) => {
				log(`Remove listener for ${fb.path.toString()} .on ${event_type}`);
				fb.off(event_type, callback);
			});
			this._fb_listeners.length = 0;
			// Remove the user from the session
			this.fb_user.remove();
			// Remove any cursor elements
			$app.find(".user-cursor").remove();
			// Reset to "untitled"
			reset_file();
		}
	}
