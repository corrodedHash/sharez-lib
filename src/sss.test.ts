import { it, describe } from "mocha"
import { assert } from "chai"
import { SSS } from "./sss"

describe("Secret sharing sanity check", () => {
  const share_gen = SSS.from_secret(Uint8Array.from([1]), 2)

  it("stores secrets correctly", () => {
    assert.deepEqual(share_gen.secret, Uint8Array.from([1]))
  })

  const shares = [share_gen.share(17), share_gen.share(101)]
  const reconstructed = SSS.from_shares(shares)

  it("reconstructs SSS correctly", () => {
    assert.deepEqual(reconstructed.secret, Uint8Array.from([1]))
  })
  it("serializes to JSON", () => {
    const serialized = JSON.stringify(share_gen)
    const deserialized = SSS.from_json(serialized)
    assert.deepEqual(deserialized, share_gen)
  })
})
