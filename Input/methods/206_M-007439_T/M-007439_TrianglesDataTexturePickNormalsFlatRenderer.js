_allocate() {

    const scene = this._scene;
    const gl = scene.canvas.gl;

    this._program = new Program(gl, this._buildShader());

    if (this._program.errors) {
        this.errors = this._program.errors;
        return;
    }

    const program = this._program;

    this._uRenderPass = program.getLocation("renderPass");
    this._uPickInvisible = program.getLocation("pickInvisible");
    this._uPositionsDecodeMatrix = program.getLocation("positionsDecodeMatrix");
    this._uWorldMatrix = program.getLocation("worldMatrix");
    this._uViewMatrix = program.getLocation("viewMatrix");
    this._uProjMatrix = program.getLocation("projMatrix");
    this._uSectionPlanes = [];

    for (let i = 0, len = scene._sectionPlanesState.sectionPlanes.length; i < len; i++) {
        this._uSectionPlanes.push({
            active: program.getLocation("sectionPlaneActive" + i),
            pos: program.getLocation("sectionPlanePos" + i),
            dir: program.getLocation("sectionPlaneDir" + i)
        });
    }

    this._aPackedVertexId = program.getAttribute("packedVertexId");


    if (scene.logarithmicDepthBufferEnabled) {
        this._uLogDepthBufFC = program.getLocation("logDepthBufFC");
    }

    this._uTexturePerObjectIdPositionsDecodeMatrix = "uTexturePerObjectIdPositionsDecodeMatrix"; 
    this._uTexturePerObjectIdColorsAndFlags = "uTexturePerObjectIdColorsAndFlags"; 
    this._uTexturePerVertexIdCoordinates = "uTexturePerVertexIdCoordinates"; 
    this._uTexturePerPolygonIdNormals = "uTexturePerPolygonIdNormals"; 
    this._uTexturePerPolygonIdIndices = "uTexturePerPolygonIdIndices"; 
    this._uTexturePerPolygonIdPortionIds = "uTexturePerPolygonIdPortionIds"; 
}
