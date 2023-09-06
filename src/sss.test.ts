import { it, describe } from "mocha"
import { assert } from "chai"
import { SSS } from "./sss"

describe("Secret sharing sanity check", () => {
  const share_gen = SSS.from_secret(Uint8Array.from([1]), 2)

  it("stores secrets correctly", () => {
    assert.deepEqual(share_gen.get_secret(), Uint8Array.from([1]))
  })

  const shares = [share_gen.get_share(17), share_gen.get_share(101)]
  const reconstructed = SSS.from_shares(shares, [17, 101])

  it("reconstructs SSS correctly", () => {
    assert.deepEqual(reconstructed.get_secret(), Uint8Array.from([1]))
  })
})
