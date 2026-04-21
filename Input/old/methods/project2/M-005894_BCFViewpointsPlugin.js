getViewpoint(options = {}) {
    const scene = this.viewer.scene;
    const camera = scene.camera;
    const realWorldOffset = scene.realWorldOffset;
    const reverseClippingPlanes = (options.reverseClippingPlanes === true);
    let bcfViewpoint = {};

    // Camera
    let lookDirection = math.normalizeVec3(math.subVec3(camera.look, camera.eye, math.vec3()));
    let eye = camera.eye;
    let up = camera.up;

    if (camera.yUp) {
        // BCF is Z up
        lookDirection = YToZ(lookDirection);
        eye = YToZ(eye);
        up = YToZ(up);
    }

    const camera_view_point = xyzArrayToObject(math.addVec3(eye, realWorldOffset));

    if (camera.projection === "ortho") {
        bcfViewpoint.orthogonal_camera = {
            camera_view_point: camera_view_point,
            camera_direction: xyzArrayToObject(lookDirection),
            camera_up_vector: xyzArrayToObject(up),
            view_to_world_scale: camera.ortho.scale,
        };
    } else {
        bcfViewpoint.perspective_camera = {
            camera_view_point: camera_view_point,
            camera_direction: xyzArrayToObject(lookDirection),
            camera_up_vector: xyzArrayToObject(up),
            field_of_view: camera.perspective.fov,
        };
    }

    // Section planes

    const sectionPlanes = scene.sectionPlanes;
    for (let id in sectionPlanes) {
        if (sectionPlanes.hasOwnProperty(id)) {
            let sectionPlane = sectionPlanes[id];
            if (!sectionPlane.active) {
                continue;
            }
            let location = sectionPlane.pos;

            let direction;
            if (reverseClippingPlanes) {
                direction = math.negateVec3(sectionPlane.dir, math.vec3());
            } else {
                direction = sectionPlane.dir;
            }

            if (camera.yUp) {
                // BCF is Z up
                location = YToZ(location);
                direction = YToZ(direction);
            }
            math.addVec3(location, realWorldOffset);

            location = xyzArrayToObject(location);
            direction = xyzArrayToObject(direction);
            if (!bcfViewpoint.clipping_planes) {
                bcfViewpoint.clipping_planes = [];
            }
            bcfViewpoint.clipping_planes.push({location, direction});
        }
    }

    // Lines

    const lineSets = scene.lineSets;
    for (let id in lineSets) {
        if (lineSets.hasOwnProperty(id)) {
            const lineSet = lineSets[id];
            if (!bcfViewpoint.lines) {
                bcfViewpoint.lines = [];
            }
            const positions = lineSet.positions;
            const indices = lineSet.indices;
            for (let i = 0, len = indices.length / 2; i < len; i++) {
                const a = indices[i * 2];
                const b = indices[(i * 2) + 1];
                bcfViewpoint.lines.push({
                    start_point: {
                        x: positions[a * 3 + 0],
                        y: positions[a * 3 + 1],
                        z: positions[a * 3 + 2]
                    },
                    end_point: {
                        x: positions[b * 3 + 0],
                        y: positions[b * 3 + 1],
                        z: positions[b * 3 + 2]
                    }
                });
            }

        }
    }

    // Bitmaps

    const bitmaps = scene.bitmaps;
    for (let id in bitmaps) {
        if (bitmaps.hasOwnProperty(id)) {
            let bitmap = bitmaps[id];
            let location = bitmap.pos;
            let normal = bitmap.normal;
            let up = bitmap.up;
            if (camera.yUp) {
                // BCF is Z up
                location = YToZ(location);
                normal = YToZ(normal);
                up = YToZ(up);
            }
            math.addVec3(location, realWorldOffset);
            if (!bcfViewpoint.bitmaps) {
                bcfViewpoint.bitmaps = [];
            }
            bcfViewpoint.bitmaps.push({
                bitmap_type: bitmap.type,
                bitmap_data: bitmap.imageData,
                location: xyzArrayToObject(location),
                normal: xyzArrayToObject(normal),
                up: xyzArrayToObject(up),
                height: bitmap.height
            });
        }
    }

    // Entity states

    bcfViewpoint.components = {
        visibility: {
            view_setup_hints: {
                spaces_visible: !!options.spacesVisible,
                space_boundaries_visible: !!options.spaceBoundariesVisible,
                openings_visible: !!options.openingsVisible
            }
        }
    };

    const opacityObjectIds = new Set(scene.opacityObjectIds);
    const xrayedObjectIds = new Set(scene.xrayedObjectIds);
    const colorizedObjectIds = new Set(scene.colorizedObjectIds);

    const coloringMap = Object.values(scene.objects)
        .filter(entity => opacityObjectIds.has(entity.id) || colorizedObjectIds.has(entity.id) || xrayedObjectIds.has(entity.id))
        .reduce((coloringMap, entity) => {

            let color = colorizeToRGB(entity.colorize);
            let alpha;

            if (entity.xrayed) {
                if (scene.xrayMaterial.fillAlpha === 0.0 && scene.xrayMaterial.edgeAlpha !== 0.0) {
                    // BCF can't deal with edges. If xRay is implemented only with edges, set an arbitrary opacity
                    alpha = 0.1;
                } else {
                    alpha = scene.xrayMaterial.fillAlpha;
                }
                alpha = Math.round(alpha * 255).toString(16).padStart(2, "0");
                color = alpha + color;
            } else if (opacityObjectIds.has(entity.id)) {
                alpha = Math.round(entity.opacity * 255).toString(16).padStart(2, "0");
                color = alpha + color;
            }

            if (!coloringMap[color]) {
                coloringMap[color] = [];
            }

            const objectId = entity.id;
            const originalSystemId = entity.originalSystemId;
            const component = {
                ifc_guid: originalSystemId,
                originating_system: this.originatingSystem
            };
            if (originalSystemId !== objectId) {
                component.authoring_tool_id = objectId;
            }

            coloringMap[color].push(component);

            return coloringMap;

        }, {});

    const coloringArray = Object.entries(coloringMap).map(([color, components]) => {
        return {color, components};
    });

    bcfViewpoint.components.coloring = coloringArray;

    const objectIds = scene.objectIds;
    const visibleObjects = scene.visibleObjects;
    const visibleObjectIds = scene.visibleObjectIds;
    const invisibleObjectIds = objectIds.filter(id => !visibleObjects[id]);
    const selectedObjectIds = scene.selectedObjectIds;

    if (options.defaultInvisible || visibleObjectIds.length < invisibleObjectIds.length) {
        bcfViewpoint.components.visibility.exceptions = this._createBCFComponents(visibleObjectIds);
        bcfViewpoint.components.visibility.default_visibility = false;
    } else {
        bcfViewpoint.components.visibility.exceptions = this._createBCFComponents(invisibleObjectIds);
        bcfViewpoint.components.visibility.default_visibility = true;
    }

    bcfViewpoint.components.selection = this._createBCFComponents(selectedObjectIds);

    if (options.snapshot !== false) {
        bcfViewpoint.snapshot = {
            snapshot_type: "png",
            snapshot_data: this.viewer.getSnapshot({format: "png"})
        };
    }

    return bcfViewpoint;
}
