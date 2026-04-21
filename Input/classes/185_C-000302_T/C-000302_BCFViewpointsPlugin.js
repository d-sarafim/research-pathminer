class BCFViewpointsPlugin extends Plugin {

    /**
     * @constructor
     * @param {Viewer} viewer The Viewer.
     * @param {Object} cfg  Plugin configuration.
     * @param {String} [cfg.id="BCFViewpoints"] Optional ID for this plugin, so that we can find it within {@link Viewer#plugins}.
     * @param {String} [cfg.originatingSystem] Identifies the originating system for BCF records.
     * @param {String} [cfg.authoringTool] Identifies the authoring tool for BCF records.
     */
    constructor(viewer, cfg = {}) {

        super("BCFViewpoints", viewer, cfg);

        /**
         * Identifies the originating system to include in BCF viewpoints saved by this plugin.
         * @property originatingSystem
         * @type {string}
         */
        this.originatingSystem = cfg.originatingSystem || "xeokit.io";

        /**
         * Identifies the authoring tool to include in BCF viewpoints saved by this plugin.
         * @property authoringTool
         * @type {string}
         */
        this.authoringTool = cfg.authoringTool || "xeokit.io";
    }

    /**
     * Saves viewer state to a BCF viewpoint.
     *
     * See ````BCFViewpointsPlugin```` class comments for more info.
     *
     * @param {*} [options] Options for getting the viewpoint.
     * @param {Boolean} [options.spacesVisible=false] Indicates whether ````IfcSpace```` types should be forced visible in the viewpoint.
     * @param {Boolean} [options.openingsVisible=false] Indicates whether ````IfcOpening```` types should be forced visible in the viewpoint.
     * @param {Boolean} [options.spaceBoundariesVisible=false] Indicates whether the boundaries of ````IfcSpace```` types should be visible in the viewpoint.
     * @param {Boolean} [options.snapshot=true] Indicates whether the snapshot should be included in the viewpoint.
     * @param {Boolean} [options.defaultInvisible=false] When ````true````, will save the default visibility of all objects
     * as ````false````. This means that when we load the viewpoint again, and there are additional models loaded that
     * were not saved in the viewpoint, those models will be hidden when we load the viewpoint, and that only the
     * objects in the viewpoint will be visible.
     * @param {Boolean} [options.reverseClippingPlanes=false] When ````true````, clipping planes are reversed (https://github.com/buildingSMART/BCF-XML/issues/193)
     * @returns {*} BCF JSON viewpoint object
     */
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

    _createBCFComponents(objectIds) {
        const scene = this.viewer.scene;
        const components = [];
        for (let i = 0, len = objectIds.length; i < len; i++) {
            const objectId = objectIds[i];
            const entity = scene.objects[objectId];
            if (entity) {
                const component = {
                    ifc_guid: entity.originalSystemId,
                    originating_system: this.originatingSystem
                };
                if (entity.originalSystemId !== objectId) {
                    component.authoring_tool_id = objectId;
                }
                components.push(component);
            }
        }
        return components;
    }

    /**
     * Sets viewer state to the given BCF viewpoint.
     *
     * Note that xeokit's {@link Camera#look} is the **point-of-interest**, whereas the BCF ````camera_direction```` is a
     * direction vector. Therefore, when loading a BCF viewpoint, we set {@link Camera#look} to the absolute position
     * obtained by offsetting the BCF ````camera_view_point````  along ````camera_direction````.
     *
     * When loading a viewpoint, we also have the option to find {@link Camera#look} as the closest point of intersection
     * (on the surface of any visible and pickable {@link Entity}) with a 3D ray fired from ````camera_view_point```` in
     * the direction of ````camera_direction````.
     *
     * @param {*} bcfViewpoint  BCF JSON viewpoint object,
     * shows default visible entities and restores camera to initial default position.
     * @param {*} [options] Options for setting the viewpoint.
     * @param {Boolean} [options.rayCast=true] When ````true```` (default), will attempt to set {@link Camera#look} to the closest
     * point of surface intersection with a ray fired from the BCF ````camera_view_point```` in the direction of ````camera_direction````.
     * @param {Boolean} [options.immediate=true] When ````true```` (default), immediately set camera position.
     * @param {Boolean} [options.duration] Flight duration in seconds.  Overrides {@link CameraFlightAnimation#duration}. Only applies when ````immediate```` is ````false````.
     * @param {Boolean} [options.reset=true] When ````true```` (default), set {@link Entity#xrayed} and {@link Entity#highlighted} ````false```` on all scene objects.
     * @param {Boolean} [options.reverseClippingPlanes=false] When ````true````, clipping planes are reversed (https://github.com/buildingSMART/BCF-XML/issues/193)
     * @param {Boolean} [options.updateCompositeObjects=false] When ````true````, then when visibility and selection updates refer to composite objects (eg. an IfcBuildingStorey),
     * then this method will apply the updates to objects within those composites.
     */
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

    _withBCFComponent(options, component, callback) {

        const viewer = this.viewer;
        const scene = viewer.scene;

        if (component.authoring_tool_id && component.originating_system === this.originatingSystem) {

            const id = component.authoring_tool_id;
            const entity = scene.objects[id];

            if (entity) {
                callback(entity);
                return
            }

            if (options.updateCompositeObjects) {
                const metaObject = viewer.metaScene.metaObjects[id];
                if (metaObject) {
                    scene.withObjects(viewer.metaScene.getObjectIDsInSubtree(id), callback);
                    return;
                }
            }
        }

        if (component.ifc_guid) {

            const originalSystemId = component.ifc_guid;
            const entity = scene.objects[originalSystemId];

            if (entity) {
                callback(entity);
                return;
            }

            if (options.updateCompositeObjects) {
                const metaObject = viewer.metaScene.metaObjects[originalSystemId];
                if (metaObject) {
                    scene.withObjects(viewer.metaScene.getObjectIDsInSubtree(originalSystemId), callback);
                    return;
                }
            }

            Object.keys(scene.models).forEach((modelId) => {

                const id = math.globalizeObjectId(modelId, originalSystemId);
                const entity = scene.objects[id];

                if (entity) {
                    callback(entity);
                    return;
                }

                if (options.updateCompositeObjects) {
                    const metaObject = viewer.metaScene.metaObjects[id];
                    if (metaObject) {
                        scene.withObjects(viewer.metaScene.getObjectIDsInSubtree(id), callback);

                    }
                }
            });
        }
    }

    /**
     * Destroys this BCFViewpointsPlugin.
     */
    destroy() {
        super.destroy();
    }
}
