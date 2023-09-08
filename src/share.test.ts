import { describe, it } from "mocha"
import { assert } from "chai"
import { getRandomInt } from "./basic"

import { Share, generateKeyPair } from "./share"

function randomData(length: number): Uint8Array {
  return Uint8Array.from([...Array(length)].map(() => getRandomInt(0, 256)))
}

describe("Share Formatter", () => {
  it("serializes and deserializes", async () => {
    for (let i = 0; i < 30; i++) {
      const data = randomData(5)
      const share_id = getRandomInt(1, 256)
      const shared_formatter = new Share(data, { xValue: share_id })
      const shared = await shared_formatter.toString()
      assert.deepEqual(
        await Share.fromString(shared),
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
    const shared = await shared_formatter.toString()
    const rebuilt = await Share.fromString(shared)
    assert.deepEqual(rebuilt, shared_formatter)
    assert(await rebuilt.verify())
  })
})
