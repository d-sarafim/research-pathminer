setViewpoint(bcfViewpoint, options = {}) {
    if (!bcfViewpoint) {
        return;
    }

    const viewer = this.viewer;
    const scene = viewer.scene;
    const camera = scene.camera;
    const rayCast = (options.rayCast !== false);
    const immediate = (options.immediate !== false);
    const reset = (options.reset !== false);
    const realWorldOffset = scene.realWorldOffset;
    const reverseClippingPlanes = (options.reverseClippingPlanes === true);

    scene.clearSectionPlanes();

    if (bcfViewpoint.clipping_planes) {
        bcfViewpoint.clipping_planes.forEach(function (e) {
            let pos = xyzObjectToArray(e.location, tempVec3);
            let dir = xyzObjectToArray(e.direction, tempVec3);

            if (reverseClippingPlanes) {
                math.negateVec3(dir);
            }
            math.subVec3(pos, realWorldOffset);

            if (camera.yUp) {
                pos = ZToY(pos);
                dir = ZToY(dir);
            }
            new SectionPlane(scene, {pos, dir});
        });
    }

    scene.clearLines();

    if (bcfViewpoint.lines) {
        const positions = [];
        const indices = [];
        let i = 0;
        bcfViewpoint.lines.forEach((e) => {
            if (!e.start_point) {
                return;
            }
            if (!e.end_point) {
                return;
            }
            positions.push(e.start_point.x);
            positions.push(e.start_point.y);
            positions.push(e.start_point.z);
            positions.push(e.end_point.x);
            positions.push(e.end_point.y);
            positions.push(e.end_point.z);
            indices.push(i++);
            indices.push(i++);
        });
        new LineSet(scene, {
            positions,
            indices,
            clippable: false,
            collidable: true
        });
    }

    scene.clearBitmaps();

    if (bcfViewpoint.bitmaps) {
        bcfViewpoint.bitmaps.forEach(function (e) {
            const bitmap_type = e.bitmap_type || "jpg"; // "jpg" | "png"
            const bitmap_data = e.bitmap_data; // base64
            let location = xyzObjectToArray(e.location, tempVec3a);
            let normal = xyzObjectToArray(e.normal, tempVec3b);
            let up = xyzObjectToArray(e.up, tempVec3c);
            let height = e.height || 1;
            if (!bitmap_type) {
                return;
            }
            if (!bitmap_data) {
                return;
            }
            if (!location) {
                return;
            }
            if (!normal) {
                return;
            }
            if (!up) {
                return;
            }
            if (camera.yUp) {
                location = ZToY(location);
                normal = ZToY(normal);
                up = ZToY(up);
            }
            new Bitmap(scene, {
                src: bitmap_data,
                type: bitmap_type,
                pos: location,
                normal: normal,
                up: up,
                clippable: false,
                collidable: true,
                height
            });
        });
    }

    if (reset) {
        scene.setObjectsXRayed(scene.xrayedObjectIds, false);
        scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
        scene.setObjectsSelected(scene.selectedObjectIds, false);
    }

    if (bcfViewpoint.components) {

        if (bcfViewpoint.components.visibility) {

            if (!bcfViewpoint.components.visibility.default_visibility) {
                scene.setObjectsVisible(scene.objectIds, false);
                if (bcfViewpoint.components.visibility.exceptions) {
                    bcfViewpoint.components.visibility.exceptions.forEach((component) => this._withBCFComponent(options, component, entity => entity.visible = true));
                }
            } else {
                scene.setObjectsVisible(scene.objectIds, true);
                if (bcfViewpoint.components.visibility.exceptions) {
                    bcfViewpoint.components.visibility.exceptions.forEach((component) => this._withBCFComponent(options, component, entity => entity.visible = false));
                }
            }

            const view_setup_hints = bcfViewpoint.components.visibility.view_setup_hints;
            if (view_setup_hints) {
                if (view_setup_hints.spaces_visible === false) {
                    scene.setObjectsVisible(viewer.metaScene.getObjectIDsByType("IfcSpace"), false);
                }
                if (view_setup_hints.openings_visible === false) {
                    scene.setObjectsVisible(viewer.metaScene.getObjectIDsByType("IfcOpening"), false);
                }
                if (view_setup_hints.space_boundaries_visible !== undefined) {
                    // TODO: Ability to show boundaries
                }
            }
        }

        if (bcfViewpoint.components.selection) {
            scene.setObjectsSelected(scene.selectedObjectIds, false);
            bcfViewpoint.components.selection.forEach(component => this._withBCFComponent(options, component, entity => entity.selected = true));

        }

        if (bcfViewpoint.components.coloring) {
            bcfViewpoint.components.coloring.forEach(coloring => {

                let color = coloring.color;
                let alpha = 0;
                let alphaDefined = false;

                if (color.length === 8) {
                    alpha = parseInt(color.substring(0, 2), 16) / 256;
                    if (alpha <= 1.0 && alpha >= 0.95) {
                        alpha = 1.0;
                    }
                    color = color.substring(2);
                    alphaDefined = true;
                }

                const colorize = [
                    parseInt(color.substring(0, 2), 16) / 256,
                    parseInt(color.substring(2, 4), 16) / 256,
                    parseInt(color.substring(4, 6), 16) / 256
                ];

                coloring.components.map(component =>
                    this._withBCFComponent(options, component, entity => {
                        entity.colorize = colorize;
                        if (alphaDefined) {
                            entity.opacity = alpha;
                        }
                    }));
            });
        }
    }

    if (bcfViewpoint.perspective_camera || bcfViewpoint.orthogonal_camera) {
        let eye;
        let look;
        let up;
        let projection;

        if (bcfViewpoint.perspective_camera) {
            eye = xyzObjectToArray(bcfViewpoint.perspective_camera.camera_view_point, tempVec3);
            look = xyzObjectToArray(bcfViewpoint.perspective_camera.camera_direction, tempVec3);
            up = xyzObjectToArray(bcfViewpoint.perspective_camera.camera_up_vector, tempVec3);

            camera.perspective.fov = bcfViewpoint.perspective_camera.field_of_view;

            projection = "perspective";
        } else {
            eye = xyzObjectToArray(bcfViewpoint.orthogonal_camera.camera_view_point, tempVec3);
            look = xyzObjectToArray(bcfViewpoint.orthogonal_camera.camera_direction, tempVec3);
            up = xyzObjectToArray(bcfViewpoint.orthogonal_camera.camera_up_vector, tempVec3);

            camera.ortho.scale = bcfViewpoint.orthogonal_camera.view_to_world_scale;

            projection = "ortho";
        }

        math.subVec3(eye, realWorldOffset);

        if (camera.yUp) {
            eye = ZToY(eye);
            look = ZToY(look);
            up = ZToY(up);
        }

        if (rayCast) {
            const hit = scene.pick({
                pickSurface: true,  // <<------ This causes picking to find the intersection point on the entity
                origin: eye,
                direction: look
            });
            look = (hit ? hit.worldPos : math.addVec3(eye, look, tempVec3));
        } else {
            look = math.addVec3(eye, look, tempVec3);
        }

        if (immediate) {
            camera.eye = eye;
            camera.look = look;
            camera.up = up;
            camera.projection = projection;
        } else {
            viewer.cameraFlight.flyTo({eye, look, up, duration: options.duration, projection});
        }
    }
}
