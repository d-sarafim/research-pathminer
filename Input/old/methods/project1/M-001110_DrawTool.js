_getRegisterMode() {
    const mode = this.getMode();
    const registerMode = DrawTool.getRegisterMode(mode);
    if (!registerMode) {
        throw new Error(mode + ' is not a valid mode of DrawTool.');
    }
    return registerMode;
}
