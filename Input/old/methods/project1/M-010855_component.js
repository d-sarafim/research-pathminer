has(nameOrType) {
    if (typeof nameOrType === 'string') {
        return !!this._scriptsIndex[nameOrType];
    }

    if (!nameOrType) return false;
    const scriptType = nameOrType;
    const scriptName = scriptType.__name;
    const scriptData = this._scriptsIndex[scriptName];
    const scriptInstance = scriptData && scriptData.instance;
    return scriptInstance instanceof scriptType; // will return false if scriptInstance undefined
}
