import type { LegacyDocumentId, AutomergeUrl, BinaryDocumentId, DocumentId, AnyDocumentId } from "./types.js";
export declare const urlPrefix = "automerge:";
/** Given an Automerge URL, returns the DocumentId in both base58check-encoded form and binary form */
export declare const parseAutomergeUrl: (url: AutomergeUrl) => {
    /** unencoded DocumentId */
    binaryDocumentId: BinaryDocumentId;
    /** encoded DocumentId */
    documentId: DocumentId;
};
/**
 * Given a documentId in either binary or base58check-encoded form, returns an Automerge URL.
 * Throws on invalid input.
 */
export declare const stringifyAutomergeUrl: (arg: UrlOptions | DocumentId | BinaryDocumentId) => AutomergeUrl;
/**
 * Given a string, returns true if it is a valid Automerge URL. This function also acts as a type
 * discriminator in Typescript.
 */
export declare const isValidAutomergeUrl: (str: unknown) => str is AutomergeUrl;
export declare const isValidDocumentId: (str: unknown) => str is DocumentId;
export declare const isValidUuid: (str: unknown) => str is LegacyDocumentId;
/**
 * Returns a new Automerge URL with a random UUID documentId. Called by Repo.create(), and also used by tests.
 */
export declare const generateAutomergeUrl: () => AutomergeUrl;
export declare const documentIdToBinary: (docId: DocumentId) => BinaryDocumentId | undefined;
export declare const binaryToDocumentId: (docId: BinaryDocumentId) => DocumentId;
export declare const parseLegacyUUID: (str: string) => AutomergeUrl | undefined;
/**
 * Given any valid expression of a document ID, returns a DocumentId in base58check-encoded form.
 *
 * Currently supports:
 * - base58check-encoded DocumentId
 * - Automerge URL
 * - legacy UUID
 * - binary DocumentId
 *
 * Throws on invalid input.
 */
export declare const interpretAsDocumentId: (id: AnyDocumentId) => DocumentId;
type UrlOptions = {
    documentId: DocumentId | BinaryDocumentId;
};
export {};
//# sourceMappingURL=AutomergeUrl.d.ts.map