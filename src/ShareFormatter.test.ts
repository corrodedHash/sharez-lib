import { test } from "mocha";
import { assert } from "chai";
import { getRandomInt } from "./basic";

import { ShareFormatter, generateKeyPair } from "./ShareFormatter";

test("Sanity test for ShareFormatter", async () => {
  for (let i = 0; i < 30; i++) {
    const data = Uint8Array.from([...Array(5)].map(() => getRandomInt(0, 256)));
    const share_id = getRandomInt(1, 256);
    const shared_formatter = new ShareFormatter(data, { share_id });
    const shared = await shared_formatter.toString();
    assert.deepEqual(
      await ShareFormatter.fromString(shared),
      shared_formatter,
      `${share_id} ${shared} ${data}`
    );
  }
});

test("Test signing", async () => {
  const kp = await generateKeyPair();
  const data = Uint8Array.from([...Array(5)].map(() => getRandomInt(0, 256)));

  const share_id = getRandomInt(1, 256);
  const shared_formatter = new ShareFormatter(data, { share_id });
  await shared_formatter.sign(kp);
  assert(await shared_formatter.verify());
  const shared = await shared_formatter.toString();
  const rebuilt = await ShareFormatter.fromString(shared);
  assert.deepEqual(rebuilt, shared_formatter);
  assert(await rebuilt.verify());
});
