import * as A from "@automerge/automerge/slim/next";
import { EventEmitter } from "eventemitter3";
import type { AutomergeUrl, DocumentId, PeerId } from "./types.js";
import { StorageId } from "./storage/types.js";
/**
 * A DocHandle is a wrapper around a single Automerge document that lets us listen for changes and
 * notify the network and storage of new changes.
 *
 * @remarks
 * A `DocHandle` represents a document which is being managed by a {@link Repo}. You shouldn't ever
 * instantiate this yourself. To obtain `DocHandle` use {@link Repo.find} or {@link Repo.create}.
 *
 * To modify the underlying document use either {@link DocHandle.change} or
 * {@link DocHandle.changeAt}. These methods will notify the `Repo` that some change has occured and
 * the `Repo` will save any new changes to the attached {@link StorageAdapter} and send sync
 * messages to connected peers.
 */
export declare class DocHandle<T> extends EventEmitter<DocHandleEvents<T>> {
    #private;
    documentId: DocumentId;
    /** @hidden */
    constructor(documentId: DocumentId, options?: DocHandleOptions<T>);
    /** Our documentId in Automerge URL form.
     */
    get url(): AutomergeUrl;
    /**
     * @returns true if the document is ready for accessing or changes.
     *
     * Note that for documents already stored locally this occurs before synchronization with any
     * peers. We do not currently have an equivalent `whenSynced()`.
     */
    isReady: () => boolean;
    /**
     * @returns true if the document has been unloaded.
     *
     * Unloaded documents are freed from memory but not removed from local storage. It's not currently
     * possible at runtime to reload an unloaded document.
     */
    isUnloaded: () => boolean;
    /**
     * @returns true if the document has been marked as deleted.
     *
     * Deleted documents are removed from local storage and the sync process. It's not currently
     * possible at runtime to undelete a document.
     */
    isDeleted: () => boolean;
    /**
     * @returns true if the document is currently unavailable.
     *
     * This will be the case if the document is not found in storage and no peers have shared it with us.
     */
    isUnavailable: () => boolean;
    /**
     * @returns true if the handle is in one of the given states.
     */
    inState: (states: HandleState[]) => boolean;
    /** @hidden */
    get state(): "idle" | "loading" | "requesting" | "ready" | "unavailable" | "unloaded" | "deleted";
    /**
     * @returns a promise that resolves when the document is in one of the given states (if no states
     * are passed, when the document is ready)
     *
     * Use this to block until the document handle has finished loading. The async equivalent to
     * checking `inState()`.
     */
    whenReady(awaitStates?: HandleState[]): Promise<void>;
    /**
     * @returns the current state of this handle's Automerge document.
     *
     * This is the recommended way to access a handle's document. Note that this waits for the handle
     * to be ready if necessary. If loading (or synchronization) fails, this will never resolve.
     */
    doc(
    /** states to wait for, such as "LOADING". mostly for internal use. */
    awaitStates?: HandleState[]): Promise<A.Doc<T> | undefined>;
    /**
     * Synchronously returns the current state of the Automerge document this handle manages, or
     * undefined. Consider using `await handle.doc()` instead. Check `isReady()`, or use `whenReady()`
     * if you want to make sure loading is complete first.
     *
     * Not to be confused with the SyncState of the document, which describes the state of the
     * synchronization process.
     *
     * Note that `undefined` is not a valid Automerge document, so the return from this function is
     * unambigous.
     *
     * @returns the current document, or undefined if the document is not ready.
     */
    docSync(): A.Doc<T> | undefined;
    /**
     * Returns the current "heads" of the document, akin to a git commit.
     * This precisely defines the state of a document.
     * @returns the current document's heads, or undefined if the document is not ready
     */
    heads(): A.Heads | undefined;
    begin(): void;
    /**
     * Creates a fixed "view" of an automerge document at the given point in time represented
     * by the `heads` passed in. The return value is the same type as docSync() and will return
     * undefined if the object hasn't finished loading.
     *
     * @remarks
     * A point-in-time in an automerge document is an *array* of heads since there may be
     * concurrent edits. This API just returns a topologically sorted history of all edits
     * so every previous entry will be (in some sense) before later ones, but the set of all possible
     * history views would be quite large under concurrency (every thing in each branch against each other).
     * There might be a clever way to think about this, but we haven't found it yet, so for now at least
     * we present a single traversable view which excludes concurrency.
     * @returns The individual heads for every change in the document.
     */
    history(): A.Heads[] | undefined;
    /**
     * Creates a fixed "view" of an automerge document at the given point in time represented
     * by the `heads` passed in. The return value is the same type as docSync() and will return
     * undefined if the object hasn't finished loading.
     *
     * @remarks
     * Note that our Typescript types do not consider change over time and the current version
     * of Automerge doesn't check types at runtime, so if you go back to an old set of heads
     * that doesn't match the heads here, Typescript will not save you.
     *
     * @returns An Automerge.Doc<T> at the point in time.
     */
    view(heads: A.Heads): A.Doc<T> | undefined;
    /**
     * Returns a set of Patch operations that will move a materialized document from one state to another
     * if applied.
     *
     * @remarks
     * We allow specifying both a from/to heads or just a single comparison point, in which case
     * the base will be the current document heads.
     *
     * @returns Automerge patches that go from one document state to the other. Use view() to get the full state.
     */
    diff(first: A.Heads, second?: A.Heads): A.Patch[] | undefined;
    /**
     * `metadata(head?)` allows you to look at the metadata for a change
     * this can be used to build history graphs to find commit messages and edit times.
     * this interface.
     *
     * @remarks
     * I'm really not convinced this is the right way to surface this information so
     * I'm leaving this API "hidden".
     *
     * @hidden
     */
    metadata(change?: string): A.DecodedChange | undefined;
    /**
     * `update` is called any time we have a new document state; could be
     * from a local change, a remote change, or a new document from storage.
     * Does not cause state changes.
     * @hidden
     */
    update(callback: (doc: A.Doc<T>) => A.Doc<T>): void;
    /**
     * `doneLoading` is called by the repo after it decides it has all the changes
     * it's going to get during setup. This might mean it was created locally,
     * or that it was loaded from storage, or that it was received from a peer.
     */
    doneLoading(): void;
    /**
     * Called by the repo either when a doc handle changes or we receive new remote heads.
     * @hidden
     */
    setRemoteHeads(storageId: StorageId, heads: A.Heads): void;
    /** Returns the heads of the storageId. */
    getRemoteHeads(storageId: StorageId): A.Heads | undefined;
    /**
     * All changes to an Automerge document should be made through this method.
     * Inside the callback, the document should be treated as mutable: all edits will be recorded
     * using a Proxy and translated into operations as part of a single recorded "change".
     *
     * Note that assignment via ES6 spread operators will result in *replacing* the object
     * instead of mutating it which will prevent clean merges. This may be what you want, but
     * `doc.foo = { ...doc.foo, bar: "baz" }` is not equivalent to `doc.foo.bar = "baz"`.
     *
     * Local changes will be stored (by the StorageSubsystem) and synchronized (by the
     * DocSynchronizer) to any peers you are sharing it with.
     *
     * @param callback - A function that takes the current document and mutates it.
     *
     */
    change(callback: A.ChangeFn<T>, options?: A.ChangeOptions<T>): void;
    /**
     * Makes a change as if the document were at `heads`.
     *
     * @returns A set of heads representing the concurrent change that was made.
     */
    changeAt(heads: A.Heads, callback: A.ChangeFn<T>, options?: A.ChangeOptions<T>): string[] | undefined;
    /**
     * Merges another document into this document. Any peers we are sharing changes with will be
     * notified of the changes resulting from the merge.
     *
     * @returns the merged document.
     *
     * @throws if either document is not ready or if `otherHandle` is unavailable.
     */
    merge(
    /** the handle of the document to merge into this one */
    otherHandle: DocHandle<T>): void;
    /**
     * Used in testing to mark this document as unavailable.
     * @hidden
     */
    unavailable(): void;
    /** Called by the repo when the document is not found in storage.
     * @hidden
     * */
    request(): void;
    /** Called by the repo to free memory used by the document. */
    unload(): void;
    /** Called by the repo to reuse an unloaded handle. */
    reload(): void;
    /** Called by the repo when the document is deleted. */
    delete(): void;
    /**
     * Sends an arbitrary ephemeral message out to all reachable peers who would receive sync messages
     * from you. It has no guarantee of delivery, and is not persisted to the underlying automerge doc
     * in any way. Messages will have a sending PeerId but this is *not* a useful user identifier (a
     * user could have multiple tabs open and would appear as multiple PeerIds). Every message source
     * must have a unique PeerId.
     */
    broadcast(message: unknown): void;
    metrics(): {
        numOps: number;
        numChanges: number;
    };
}
/** @hidden */
export type DocHandleOptions<T> = {
    /** If we know this is a new document (because we're creating it) this should be set to true. */
    isNew: true;
    /** The initial value of the document. */
    initialValue?: T;
} | {
    isNew?: false;
    /** The number of milliseconds before we mark this document as unavailable if we don't have it and nobody shares it with us. */
    timeoutDelay?: number;
};
/** These are the events that this DocHandle emits to external listeners */
export interface DocHandleEvents<T> {
    "heads-changed": (payload: DocHandleEncodedChangePayload<T>) => void;
    change: (payload: DocHandleChangePayload<T>) => void;
    delete: (payload: DocHandleDeletePayload<T>) => void;
    unavailable: (payload: DocHandleUnavailablePayload<T>) => void;
    "ephemeral-message": (payload: DocHandleEphemeralMessagePayload<T>) => void;
    "ephemeral-message-outbound": (payload: DocHandleOutboundEphemeralMessagePayload<T>) => void;
    "remote-heads": (payload: DocHandleRemoteHeadsPayload) => void;
}
/** Emitted when this document's heads have changed */
export interface DocHandleEncodedChangePayload<T> {
    handle: DocHandle<T>;
    doc: A.Doc<T>;
}
/** Emitted when this document has changed */
export interface DocHandleChangePayload<T> {
    /** The handle that changed */
    handle: DocHandle<T>;
    /** The value of the document after the change */
    doc: A.Doc<T>;
    /** The patches representing the change that occurred */
    patches: A.Patch[];
    /** Information about the change */
    patchInfo: A.PatchInfo<T>;
}
/** Emitted when this document is deleted */
export interface DocHandleDeletePayload<T> {
    handle: DocHandle<T>;
}
/** Emitted when this document has been marked unavailable */
export interface DocHandleUnavailablePayload<T> {
    handle: DocHandle<T>;
}
/** Emitted when an ephemeral message is received for the document */
export interface DocHandleEphemeralMessagePayload<T> {
    handle: DocHandle<T>;
    senderId: PeerId;
    message: unknown;
}
/** Emitted when an ephemeral message is sent for this document */
export interface DocHandleOutboundEphemeralMessagePayload<T> {
    handle: DocHandle<T>;
    data: Uint8Array;
}
/** Emitted when we have new remote heads for this document */
export interface DocHandleRemoteHeadsPayload {
    storageId: StorageId;
    heads: A.Heads;
}
/**
 * Possible internal states for a DocHandle
 */
export declare const HandleState: {
    /** The handle has been created but not yet loaded or requested */
    readonly IDLE: "idle";
    /** We are waiting for storage to finish loading */
    readonly LOADING: "loading";
    /** We are waiting for someone in the network to respond to a sync request */
    readonly REQUESTING: "requesting";
    /** The document is available */
    readonly READY: "ready";
    /** The document has been unloaded from the handle, to free memory usage */
    readonly UNLOADED: "unloaded";
    /** The document has been deleted from the repo */
    readonly DELETED: "deleted";
    /** The document was not available in storage or from any connected peers */
    readonly UNAVAILABLE: "unavailable";
};
export type HandleState = (typeof HandleState)[keyof typeof HandleState];
export declare const IDLE: "idle", LOADING: "loading", REQUESTING: "requesting", READY: "ready", UNLOADED: "unloaded", DELETED: "deleted", UNAVAILABLE: "unavailable";
//# sourceMappingURL=DocHandle.d.ts.map