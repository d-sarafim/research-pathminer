toJSON() {
    const profile = {
        'type': this.getJSONType(),
        'id': this.getId(),
        'options': this.config()
    };
    return profile;
}
