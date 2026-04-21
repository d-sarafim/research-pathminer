class BasisClient {
    constructor(queue, config, eager) {
        this.queue = queue;
        this.worker = new Worker(config.workerUrl);
        this.worker.addEventListener('message', (message) => {
            const data = message.data;
            this.queue.handleResponse(data.url, data.err, data.data);
            if (!this.eager) {
                this.queue.enqueueClient(this);
            }
        });
        this.worker.postMessage({ type: 'init', config: config });

        // an eager client will enqueue itself while a job is running. a
        // non-eager client will only enqueue itself once the current job
        // has finished running.
        this.eager = eager;
    }

    run(job) {
        const transfer = [];
        if (job.data instanceof ArrayBuffer) {
            transfer.push(job.data);
        }
        this.worker.postMessage({
            type: 'transcode',
            url: job.url,
            format: job.format,
            data: job.data,
            options: job.options
        }, transfer);
        if (this.eager) {
            this.queue.enqueueClient(this);
        }
    }
}
