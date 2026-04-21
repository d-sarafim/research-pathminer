class ResourceWorkerConnection extends Actor {
    constructor() {
        super(imageFetchWorkerKey);
    }

    fetchImage(url, cb) {
        const data = {
            url
        };
        this.send(data, EMPTY_ARRAY, cb);
    }
}
