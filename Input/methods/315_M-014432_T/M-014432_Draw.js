constructor(options) {
  const pointerOptions = /** @type {import("./Pointer.js").Options} */ (
    options
  );
  if (!pointerOptions.stopDown) {
    pointerOptions.stopDown = FALSE;
  }

  super(pointerOptions);

  /***
   * @type {DrawOnSignature<import("../events").EventsKey>}
   */
  this.on;

  /***
   * @type {DrawOnSignature<import("../events").EventsKey>}
   */
  this.once;

  /***
   * @type {DrawOnSignature<void>}
   */
  this.un;

  /**
   * @type {boolean}
   * @private
   */
  this.shouldHandle_ = false;

  /**
   * @type {import("../pixel.js").Pixel}
   * @private
   */
  this.downPx_ = null;

  /**
   * @type {ReturnType<typeof setTimeout>}
   * @private
   */
  this.downTimeout_;

  /**
   * @type {number|undefined}
   * @private
   */
  this.lastDragTime_;

  /**
   * Pointer type of the last pointermove event
   * @type {string}
   * @private
   */
  this.pointerType_;

  /**
   * @type {boolean}
   * @private
   */
  this.freehand_ = false;

  /**
   * Target source for drawn features.
   * @type {VectorSource|null}
   * @private
   */
  this.source_ = options.source ? options.source : null;

  /**
   * Target collection for drawn features.
   * @type {import("../Collection.js").default<Feature>|null}
   * @private
   */
  this.features_ = options.features ? options.features : null;

  /**
   * Pixel distance for snapping.
   * @type {number}
   * @private
   */
  this.snapTolerance_ = options.snapTolerance ? options.snapTolerance : 12;

  /**
   * Geometry type.
   * @type {import("../geom/Geometry.js").Type}
   * @private
   */
  this.type_ = /** @type {import("../geom/Geometry.js").Type} */ (
    options.type
  );

  /**
   * Drawing mode (derived from geometry type.
   * @type {Mode}
   * @private
   */
  this.mode_ = getMode(this.type_);

  /**
   * Stop click, singleclick, and doubleclick events from firing during drawing.
   * Default is `false`.
   * @type {boolean}
   * @private
   */
  this.stopClick_ = !!options.stopClick;

  /**
   * The number of points that must be drawn before a polygon ring or line
   * string can be finished.  The default is 3 for polygon rings and 2 for
   * line strings.
   * @type {number}
   * @private
   */
  this.minPoints_ = options.minPoints
    ? options.minPoints
    : this.mode_ === 'Polygon'
    ? 3
    : 2;

  /**
   * The number of points that can be drawn before a polygon ring or line string
   * is finished. The default is no restriction.
   * @type {number}
   * @private
   */
  this.maxPoints_ =
    this.mode_ === 'Circle'
      ? 2
      : options.maxPoints
      ? options.maxPoints
      : Infinity;

  /**
   * A function to decide if a potential finish coordinate is permissible
   * @private
   * @type {import("../events/condition.js").Condition}
   */
  this.finishCondition_ = options.finishCondition
    ? options.finishCondition
    : TRUE;

  /**
   * @private
   * @type {import("../geom/Geometry.js").GeometryLayout}
   */
  this.geometryLayout_ = options.geometryLayout
    ? options.geometryLayout
    : 'XY';

  let geometryFunction = options.geometryFunction;
  if (!geometryFunction) {
    const mode = this.mode_;
    if (mode === 'Circle') {
      /**
       * @param {!LineCoordType} coordinates The coordinates.
       * @param {import("../geom/SimpleGeometry.js").default|undefined} geometry Optional geometry.
       * @param {import("../proj/Projection.js").default} projection The view projection.
       * @return {import("../geom/SimpleGeometry.js").default} A geometry.
       */
      geometryFunction = function (coordinates, geometry, projection) {
        const circle = geometry
          ? /** @type {Circle} */ (geometry)
          : new Circle([NaN, NaN]);
        const center = fromUserCoordinate(coordinates[0], projection);
        const squaredLength = squaredCoordinateDistance(
          center,
          fromUserCoordinate(coordinates[coordinates.length - 1], projection)
        );
        circle.setCenterAndRadius(
          center,
          Math.sqrt(squaredLength),
          this.geometryLayout_
        );
        const userProjection = getUserProjection();
        if (userProjection) {
          circle.transform(projection, userProjection);
        }
        return circle;
      };
    } else {
      let Constructor;
      if (mode === 'Point') {
        Constructor = Point;
      } else if (mode === 'LineString') {
        Constructor = LineString;
      } else if (mode === 'Polygon') {
        Constructor = Polygon;
      }
      /**
       * @param {!LineCoordType} coordinates The coordinates.
       * @param {import("../geom/SimpleGeometry.js").default|undefined} geometry Optional geometry.
       * @param {import("../proj/Projection.js").default} projection The view projection.
       * @return {import("../geom/SimpleGeometry.js").default} A geometry.
       */
      geometryFunction = function (coordinates, geometry, projection) {
        if (geometry) {
          if (mode === 'Polygon') {
            if (coordinates[0].length) {
              // Add a closing coordinate to match the first
              geometry.setCoordinates(
                [coordinates[0].concat([coordinates[0][0]])],
                this.geometryLayout_
              );
            } else {
              geometry.setCoordinates([], this.geometryLayout_);
            }
          } else {
            geometry.setCoordinates(coordinates, this.geometryLayout_);
          }
        } else {
          geometry = new Constructor(coordinates, this.geometryLayout_);
        }
        return geometry;
      };
    }
  }

  /**
   * @type {GeometryFunction}
   * @private
   */
  this.geometryFunction_ = geometryFunction;

  /**
   * @type {number}
   * @private
   */
  this.dragVertexDelay_ =
    options.dragVertexDelay !== undefined ? options.dragVertexDelay : 500;

  /**
   * Finish coordinate for the feature (first point for polygons, last point for
   * linestrings).
   * @type {import("../coordinate.js").Coordinate}
   * @private
   */
  this.finishCoordinate_ = null;

  /**
   * Sketch feature.
   * @type {Feature<import('../geom/SimpleGeometry.js').default>}
   * @private
   */
  this.sketchFeature_ = null;

  /**
   * Sketch point.
   * @type {Feature<Point>}
   * @private
   */
  this.sketchPoint_ = null;

  /**
   * Sketch coordinates. Used when drawing a line or polygon.
   * @type {SketchCoordType}
   * @private
   */
  this.sketchCoords_ = null;

  /**
   * Sketch line. Used when drawing polygon.
   * @type {Feature<LineString>}
   * @private
   */
  this.sketchLine_ = null;

  /**
   * Sketch line coordinates. Used when drawing a polygon or circle.
   * @type {LineCoordType}
   * @private
   */
  this.sketchLineCoords_ = null;

  /**
   * Squared tolerance for handling up events.  If the squared distance
   * between a down and up event is greater than this tolerance, up events
   * will not be handled.
   * @type {number}
   * @private
   */
  this.squaredClickTolerance_ = options.clickTolerance
    ? options.clickTolerance * options.clickTolerance
    : 36;

  /**
   * Draw overlay where our sketch features are drawn.
   * @type {VectorLayer}
   * @private
   */
  this.overlay_ = new VectorLayer({
    source: new VectorSource({
      useSpatialIndex: false,
      wrapX: options.wrapX ? options.wrapX : false,
    }),
    style: options.style ? options.style : getDefaultStyleFunction(),
    updateWhileInteracting: true,
  });

  /**
   * Name of the geometry attribute for newly created features.
   * @type {string|undefined}
   * @private
   */
  this.geometryName_ = options.geometryName;

  /**
   * @private
   * @type {import("../events/condition.js").Condition}
   */
  this.condition_ = options.condition ? options.condition : noModifierKeys;

  /**
   * @private
   * @type {import("../events/condition.js").Condition}
   */
  this.freehandCondition_;
  if (options.freehand) {
    this.freehandCondition_ = always;
  } else {
    this.freehandCondition_ = options.freehandCondition
      ? options.freehandCondition
      : shiftKeyOnly;
  }

  /**
   * @type {import("../events/condition.js").Condition}
   * @private
   */
  this.traceCondition_;
  this.setTrace(options.trace || false);

  /**
   * @type {TraceState}
   * @private
   */
  this.traceState_ = {active: false};

  /**
   * @type {VectorSource|null}
   * @private
   */
  this.traceSource_ = options.traceSource || options.source || null;

  this.addChangeListener(InteractionProperty.ACTIVE, this.updateState_);
}
