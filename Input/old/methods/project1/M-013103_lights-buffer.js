addLightAreaSizes(data8, index, light) {
    const areaSizes = this.getLightAreaSizes(light);
    for (let i = 0; i < 6; i++) {  // these are full float range
        FloatPacking.float2MantissaExponent(areaSizes[i], data8, index + 4 * i, 4);
    }
}
