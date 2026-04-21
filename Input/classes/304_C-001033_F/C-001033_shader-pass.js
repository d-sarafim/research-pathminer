class ShaderPass {
    /**
     * Allocated shader passes, map of a shader pass name to info.
     *
     * @type {Map<string, ShaderPassInfo>}
     */
    passesNamed = new Map();

    /**
     * Allocated shader passes, indexed by their index.
     *
     * @type {Array<ShaderPassInfo>}
     */
    passesIndexed = [];

    /** Next available index */
    nextIndex = 0;

    constructor() {

        const add = (name, index, options) => {
            const info = this.allocate(name, options);
            Debug.assert(info.index === index);
        };

        // add default passes in the required order, to match the constants
        add('forward', SHADER_FORWARD, { isForward: true });
        add('forward_hdr', SHADER_FORWARDHDR, { isForward: true });
        add('depth', SHADER_DEPTH);
        add('pick', SHADER_PICK);
        add('shadow', SHADER_SHADOW);
    }

    /**
     * Get access to the shader pass instance for the specified device.
     *
     * @param {import('../platform/graphics/graphics-device.js').GraphicsDevice} device - The
     * graphics device.
     * @returns { ShaderPass } The shader pass instance for the specified device.
     */
    static get(device) {
        Debug.assert(device);

        return shaderPassDeviceCache.get(device, () => {
            return new ShaderPass();
        });
    }

    /**
     * Allocates a shader pass with the specified name and options.
     *
     * @param {string} name - A name of the shader pass.
     * @param {object} options - Options for the shader pass, which are added as properties to the
     * shader pass info.
     * @returns {ShaderPassInfo} The allocated shader pass info.
     */
    allocate(name, options) {
        let info = this.passesNamed.get(name);
        if (info === undefined) {
            info = new ShaderPassInfo(name, this.nextIndex, options);
            this.passesNamed.set(info.name, info);
            this.passesIndexed[info.index] = info;
            this.nextIndex++;
        }
        return info;
    }

    /**
     * Return the shader pass info for the specified index.
     *
     * @param {number} index - The shader pass index.
     * @returns {ShaderPassInfo} - The shader pass info.
     */
    getByIndex(index) {
        const info = this.passesIndexed[index];
        Debug.assert(info);
        return info;
    }

    getByName(name) {
        return this.passesNamed.get(name);
    }
}
