import { test, describe } from "mocha";
import { expect } from "chai";
import { SSS } from "./sss";

describe("Secret sharing sanity check", () => {
  const share_gen = SSS.from_secret(Uint8Array.from([1]), 2);

  test("Secret is stored correctly", () => {
    expect(share_gen.get_secret()).to.deep.equal(Uint8Array.from([1]));
  });

  const shares = [share_gen.get_share(17), share_gen.get_share(101)];
  const reconstructed = SSS.from_shares(shares, [17, 101]);

  test("SSS reconstructed correctly", () => {
    expect(reconstructed.get_secret()).to.deep.equal(Uint8Array.from([1]));
  });
});
