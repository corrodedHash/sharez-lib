import { describe, it } from "mocha"
import { assert } from "chai"
import { getRandomInt } from "./util/common"

import { Share } from "./share"
import { generateKeyPair, sign, verify } from "./shareSignature"

import { ShareEncoder, ShareDecoder } from "./shareSerialization"

function randomData(length: number): Uint8Array {
  return Uint8Array.from([...Array(length)].map(() => getRandomInt(0, 256)))
}

describe("Share Formatter", () => {
  it("serializes and deserializes", async () => {
    for (let i = 0; i < 30; i++) {
      const data = randomData(5)
      const share_id = getRandomInt(1, 256)
      const shared_formatter: Share = { yValues: data, xValue: share_id }
      const shared = await new ShareEncoder().encode(shared_formatter)
      const { share: decodedShare } = await new ShareDecoder().decode(shared)
      assert.deepEqual(
        decodedShare,
        shared_formatter,
        `${share_id} ${shared} ${data}`
      )
    }
  })
  it("signs correctly", async () => {
    const kp = await generateKeyPair()
    const data = randomData(5)
    const share_id = getRandomInt(1, 256)
    const shared_formatter: Share = { yValues: data, xValue: share_id }
    const share_signature = await sign(shared_formatter, kp)
    assert(await verify(shared_formatter, share_signature))
    const shared = await new ShareEncoder().encode(
      shared_formatter,
      share_signature
    )
    const { share: rebuiltShare, signature: rebuiltSignature } =
      await new ShareDecoder().decode(shared)
    assert.deepEqual(rebuiltShare, shared_formatter)
    assert.notStrictEqual(rebuiltSignature, undefined)
    if (rebuiltSignature === undefined) throw new Error("Make linter happy")
    assert(await verify(rebuiltShare, rebuiltSignature))
  })
})
