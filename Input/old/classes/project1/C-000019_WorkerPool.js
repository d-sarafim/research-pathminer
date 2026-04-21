export default class WorkerPool {
    constructor() {
        this.active = {};
        this.workerCount = typeof window !== 'undefined' ? (window.MAPTALKS_WORKER_COUNT || workerCount) : 0;
        this._messages = [];
        this._messageBuffers = [];
    }

    acquire(id) {
        if (!this.workers) {
            this.workers = [];
            const url = getWorkerSourcePath();
            for (let i = 0; i < this.workerCount; i++) {
                const worker = new Worker(url);
                worker.id = i;
                this.workers.push(worker);
            }
            URL.revokeObjectURL(url);
            setWorkersCreated();
        }
        this.active[id] = true;

        return this.workers.slice();
    }

    release(id) {
        delete this.active[id];
        if (Object.keys(this.active).length === 0) {
            this.workers.forEach((w) => {
                w.terminate();
            });
            this.workers = null;
        }
    }

    addMessage(workerId, data, buffers) {
        let batches = this._messages[workerId];
        if (!batches || !batches.length) {
            batches = this._messages[workerId] = [new MessageBatch()];
        }
        let batch = batches[batches.length - 1];
        if (batch.isFull()) {
            batch = new MessageBatch();
            this._messages[workerId].push(batch);
        }
        batch.addMessage(data, buffers);
    }

    commit() {
        if (!this.workers) {
            return;
        }
        if (this._messages.length) {
            for (let i = 0; i < this._messages.length; i++) {
                if (!this._messages[i] || !this._messages[i].length) {
                    continue;
                }
                const batch = this._messages[i].shift();
                this.workers[i].postMessage(batch.getMessage(), batch.buffers);
            }
        }
    }
}
