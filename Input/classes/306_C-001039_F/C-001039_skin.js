class Skin {
    /**
     * Create a new Skin instance.
     *
     * @param {import('../platform/graphics/graphics-device.js').GraphicsDevice} graphicsDevice -
     * The graphics device used to manage this skin.
     * @param {import('../core/math/mat4.js').Mat4[]} ibp - The array of inverse bind matrices.
     * @param {string[]} boneNames - The array of bone names for the bones referenced by this skin.
     */
    constructor(graphicsDevice, ibp, boneNames) {
        // Constant between clones
        this.device = graphicsDevice;
        this.inverseBindPose = ibp;
        this.boneNames = boneNames;
    }
}
