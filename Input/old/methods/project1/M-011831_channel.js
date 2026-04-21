constructor(manager, sound, options = {}) {
    this.volume = options.volume ?? 1;
    this.loop = options.loop ?? false;
    this.pitch = options.pitch ?? 1;

    this.sound = sound;

    this.paused = false;
    this.suspended = false;

    this.manager = manager;

    this.source = null;

    if (hasAudioContext()) {
        this.startTime = 0;
        this.startOffset = 0;

        const context = manager.context;
        this.gain = context.createGain();
    } else if (sound.audio) {
        // handle the case where sound was
        this.source = sound.audio.cloneNode(false);
        this.source.pause(); // not initially playing
    }
}
