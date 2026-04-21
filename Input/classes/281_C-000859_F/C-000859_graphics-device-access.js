class GraphicsDeviceAccess {
    static _graphicsDevice = null;

    static set(graphicsDevice) {
        GraphicsDeviceAccess._graphicsDevice = graphicsDevice;
    }

    static get() {
        return GraphicsDeviceAccess._graphicsDevice;
    }
}
