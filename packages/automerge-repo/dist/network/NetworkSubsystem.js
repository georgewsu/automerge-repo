import debug from "debug";
import { EventEmitter } from "eventemitter3";
import { isEphemeralMessage, isRepoMessage, } from "./messages.js";
const getEphemeralMessageSource = (message) => `${message.senderId}:${message.sessionId}`;
export class NetworkSubsystem extends EventEmitter {
    peerId;
    peerMetadata;
    #log;
    #adaptersByPeer = {};
    #count = 0;
    #sessionId = Math.random().toString(36).slice(2);
    #ephemeralSessionCounts = {};
    adapters = [];
    constructor(adapters, peerId, peerMetadata) {
        super();
        this.peerId = peerId;
        this.peerMetadata = peerMetadata;
        this.#log = debug(`automerge-repo:network:${this.peerId}`);
        adapters.forEach(a => this.addNetworkAdapter(a));
    }
    disconnect() {
        this.adapters.forEach(a => a.disconnect());
    }
    reconnect() {
        this.adapters.forEach(a => a.connect(this.peerId));
    }
    addNetworkAdapter(networkAdapter) {
        this.adapters.push(networkAdapter);
        networkAdapter.on("peer-candidate", ({ peerId, peerMetadata }) => {
            this.#log(`peer candidate: ${peerId} `);
            // TODO: This is where authentication would happen
            // TODO: on reconnection, this would create problems!
            // the server would see a reconnection as a late-arriving channel
            // for an existing peer and decide to ignore it until the connection
            // times out: turns out my ICE/SIP emulation laziness did not pay off here
            if (!this.#adaptersByPeer[peerId]) {
                // TODO: handle losing a server here
                this.#adaptersByPeer[peerId] = networkAdapter;
            }
            this.emit("peer", { peerId, peerMetadata });
        });
        networkAdapter.on("peer-disconnected", ({ peerId }) => {
            this.#log(`peer disconnected: ${peerId} `);
            delete this.#adaptersByPeer[peerId];
            this.emit("peer-disconnected", { peerId });
        });
        networkAdapter.on("message", msg => {
            if (!isRepoMessage(msg)) {
                this.#log(`invalid message: ${JSON.stringify(msg)}`);
                return;
            }
            this.#log(`message from ${msg.senderId}`);
            if (isEphemeralMessage(msg)) {
                const source = getEphemeralMessageSource(msg);
                if (this.#ephemeralSessionCounts[source] === undefined ||
                    msg.count > this.#ephemeralSessionCounts[source]) {
                    this.#ephemeralSessionCounts[source] = msg.count;
                    this.emit("message", msg);
                }
                return;
            }
            this.emit("message", msg);
        });
        networkAdapter.on("close", () => {
            this.#log("adapter closed");
            Object.entries(this.#adaptersByPeer).forEach(([peerId, other]) => {
                if (other === networkAdapter) {
                    delete this.#adaptersByPeer[peerId];
                }
            });
        });
        this.peerMetadata
            .then(peerMetadata => {
            networkAdapter.connect(this.peerId, peerMetadata);
        })
            .catch(err => {
            this.#log("error connecting to network", err);
        });
    }
    // TODO: this probably introduces a race condition for the ready event
    // but I plan to refactor that as part of this branch in another patch
    removeNetworkAdapter(networkAdapter) {
        this.adapters = this.adapters.filter(a => a !== networkAdapter);
        networkAdapter.disconnect();
    }
    send(message) {
        const peer = this.#adaptersByPeer[message.targetId];
        if (!peer) {
            this.#log(`Tried to send message but peer not found: ${message.targetId}`);
            return;
        }
        /** Messages come in without a senderId and other required information; this is where we make
         * sure they have everything they need.
         */
        const prepareMessage = (message) => {
            if (message.type === "ephemeral") {
                if ("count" in message) {
                    // existing ephemeral message from another peer; pass on without changes
                    return message;
                }
                else {
                    // new ephemeral message from us; add our senderId as well as a counter and session id
                    return {
                        ...message,
                        count: ++this.#count,
                        sessionId: this.#sessionId,
                        senderId: this.peerId,
                    };
                }
            }
            else {
                // other message type; just add our senderId
                return {
                    ...message,
                    senderId: this.peerId,
                };
            }
        };
        const outbound = prepareMessage(message);
        this.#log("sending message %o", outbound);
        peer.send(outbound);
    }
    isReady = () => {
        return this.adapters.every(a => a.isReady());
    };
    whenReady = async () => {
        return Promise.all(this.adapters.map(a => a.whenReady()));
    };
}