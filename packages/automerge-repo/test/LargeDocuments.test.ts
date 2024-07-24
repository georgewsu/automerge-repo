import assert from "assert"
import { describe, it } from "vitest"
import { Repo } from "../src/Repo.js"
import { DummyNetworkAdapter } from "../src/helpers/DummyNetworkAdapter.js"
import { DummyStorageAdapter } from "../src/helpers/DummyStorageAdapter.js"
import { generateLargeNumberArrayObject, LargeNumberArrayObject } from "./helpers/generate-large-object.js"
import * as Automerge from "@automerge/automerge/next"
import { DocumentId } from "../src/index.js"
import { pause } from "../src/helpers/pause.js"
import { READY } from "../src/DocHandle.js"

describe("Repo", () => {
  describe("local only", () => {
    const setup = ({ startReady = true } = {}) => {
      const storageAdapter = new DummyStorageAdapter()
      const networkAdapter = new DummyNetworkAdapter({ startReady })

      const repo = new Repo({
        storage: storageAdapter,
        network: [networkAdapter],
      })
      repo.saveDebounceRate = 1
      return { repo, storageAdapter, networkAdapter }
    }

    const largeObject = generateLargeNumberArrayObject(125000) // 8 bytes per number, 125 numbers per 1KB, 125000 numbers per 1MB

    const createAndFreeLargeDoc = () => {
      try {
        const doc = Automerge.from(largeObject)
        Automerge.free(doc)
      } catch (e) {
        console.log(e)
        throw e
      }
    }

    it("can create documents directly with large objects in initial value", async () => {
      for (let i = 0; i < 10 ; i++) {
        createAndFreeLargeDoc()
      }
    }, 1800000)

    it("can create and delete large documents", async () => {
      const { repo } = setup()
      for (let i = 0; i < 10; i++) {
        try {
          const handle = repo.create<{ objects: LargeNumberArrayObject[] }>({ objects: [largeObject] })
          await handle.doc()
          repo.delete(handle.documentId)
          assert(handle.isDeleted())
          assert.equal(repo.handles[handle.documentId], undefined)
        } catch (e) {
          console.log(e)
          throw e
        }
      }
    }, 1800000)

    it("can remove a document from cache", async () => {
      const { repo } = setup()
      for (let i = 0; i < 10; i++) {
        const handle = repo.create<{ objects: LargeNumberArrayObject[] }>({ objects: [largeObject] })
        const documentId = handle.documentId
        await handle.doc()
        await repo.removeFromCache(documentId)
        assert.equal(repo.handles[handle.documentId], undefined)
      }
    }, 1800000)

    it("can clear cache", async () => {
      const { repo } = setup()
      for (let i = 0; i < 10; i++) {
        const handle = repo.create<{ objects: LargeNumberArrayObject[] }>({ objects: [largeObject] })
        const documentId = handle.documentId
        await handle.doc()
        await repo.clearCache()
        assert.equal(repo.handles[handle.documentId], undefined)
      }
    }, 1800000)
  })
})
