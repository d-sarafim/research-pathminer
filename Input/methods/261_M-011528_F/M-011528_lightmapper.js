setupLightArray(lightArray, light) {

    lightArray[LIGHTTYPE_DIRECTIONAL].length = 0;
    lightArray[LIGHTTYPE_OMNI].length = 0;
    lightArray[LIGHTTYPE_SPOT].length = 0;

    lightArray[light.type][0] = light;
    light.visibleThisFrame = true;
}
