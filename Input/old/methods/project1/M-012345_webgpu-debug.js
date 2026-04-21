static validate(device) {
    device.wgpu.pushErrorScope('validation');
    WebgpuDebug._scopes.push('validation');
}
