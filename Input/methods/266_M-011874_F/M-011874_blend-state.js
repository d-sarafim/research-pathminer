constructor(blend = false, colorOp = BLENDEQUATION_ADD, colorSrcFactor = BLENDMODE_ONE, colorDstFactor = BLENDMODE_ZERO,
    alphaOp, alphaSrcFactor, alphaDstFactor,
    redWrite = true, greenWrite = true, blueWrite = true, alphaWrite = true) {
    this.setColorBlend(colorOp, colorSrcFactor, colorDstFactor);
    this.setAlphaBlend(alphaOp ?? colorOp, alphaSrcFactor ?? colorSrcFactor, alphaDstFactor ?? colorDstFactor);
    this.setColorWrite(redWrite, greenWrite, blueWrite, alphaWrite);
    this.blend = blend;
}
