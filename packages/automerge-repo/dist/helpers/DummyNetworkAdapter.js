import { pause } from "../../src/helpers/pause.js";
import { NetworkAdapter } from "../../src/index.js";
export class DummyNetworkAdapter extends NetworkAdapter {
    #sendMessage;
    #ready = false;
    #readyResolver;
    #readyPromise = new Promise(resolve => {
        this.#readyResolver = resolve;
    });
    isReady() {
        return this.#ready;
    }
    whenReady() {
        return this.#readyPromise;
    }
    #forceReady() {
        if (!this.#ready) {
            this.#ready = true;
            this.#readyResolver?.();
        }
    }
    // A public wrapper for use in tests!
    forceReady() {
        this.#forceReady();
    }
    constructor(opts = { startReady: true }) {
        super();
        if (opts.startReady) {
            this.#forceReady();
        }
        this.#sendMessage = opts.sendMessage;
    }
    connect(peerId) {
        this.peerId = peerId;
    }
    disconnect() { }
    peerCandidate(peerId) {
        this.emit("peer-candidate", { peerId, peerMetadata: {} });
    }
    send(message) {
        this.#sendMessage?.(message);
    }
    receive(message) {
        this.emit("message", message);
    }
    static createConnectedPair({ latency = 10 } = {}) {
        const adapter1 = new DummyNetworkAdapter({
            startReady: true,
            sendMessage: (message) => pause(latency).then(() => adapter2.receive(message)),
        });
        const adapter2 = new DummyNetworkAdapter({
            startReady: true,
            sendMessage: (message) => pause(latency).then(() => adapter1.receive(message)),
        });
        return [adapter1, adapter2];
    }
}
