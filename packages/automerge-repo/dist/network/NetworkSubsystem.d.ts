import { EventEmitter } from "eventemitter3";
import { PeerId } from "../types.js";
import type { NetworkAdapterInterface, PeerDisconnectedPayload, PeerMetadata } from "./NetworkAdapterInterface.js";
import { MessageContents, RepoMessage } from "./messages.js";
export declare class NetworkSubsystem extends EventEmitter<NetworkSubsystemEvents> {
    #private;
    peerId: PeerId;
    private peerMetadata;
    adapters: NetworkAdapterInterface[];
    constructor(adapters: NetworkAdapterInterface[], peerId: PeerId, peerMetadata: Promise<PeerMetadata>);
    disconnect(): void;
    reconnect(): void;
    addNetworkAdapter(networkAdapter: NetworkAdapterInterface): void;
    removeNetworkAdapter(networkAdapter: NetworkAdapterInterface): void;
    send(message: MessageContents): void;
    isReady: () => boolean;
    whenReady: () => Promise<void[]>;
}
export interface NetworkSubsystemEvents {
    peer: (payload: PeerPayload) => void;
    "peer-disconnected": (payload: PeerDisconnectedPayload) => void;
    message: (payload: RepoMessage) => void;
}
export interface PeerPayload {
    peerId: PeerId;
    peerMetadata: PeerMetadata;
}
//# sourceMappingURL=NetworkSubsystem.d.ts.map