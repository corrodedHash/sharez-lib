import { describe, it } from "mocha"
import { assert } from "chai"
import { getRandomInt } from "./util/common"

import { Share, generateKeyPair } from "./share"

import { ShareEncoder, ShareDecoder } from "./shareSerialization"

function randomData(length: number): Uint8Array {
  return Uint8Array.from([...Array(length)].map(() => getRandomInt(0, 256)))
}

describe("Share Formatter", () => {
  it("serializes and deserializes", async () => {
    for (let i = 0; i < 30; i++) {
      const data = randomData(5)
      const share_id = getRandomInt(1, 256)
      const shared_formatter = new Share(data, { xValue: share_id })
      const shared = await new ShareEncoder().encode(shared_formatter)
      assert.deepEqual(
        await new ShareDecoder().decode(shared),
        shared_formatter,
        `${share_id} ${shared} ${data}`
      )
    }
  })
  it("signs correctly", async () => {
    const kp = await generateKeyPair()
    const data = randomData(5)
    const share_id = getRandomInt(1, 256)
    const shared_formatter = new Share(data, { xValue: share_id })
    await shared_formatter.sign(kp)
    assert(await shared_formatter.verify())
    const shared = await new ShareEncoder().encode(shared_formatter)
    const rebuilt = await new ShareDecoder().decode(shared)
    assert.deepEqual(rebuilt, shared_formatter)
    assert(await rebuilt.verify())
  })
})
