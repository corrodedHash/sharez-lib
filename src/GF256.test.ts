import { describe, it } from "mocha";
import { assert } from "chai";
import { GF256Element as GF } from "./GF256";

describe("GF256", () => {
  it("should multiply correctly", () => {
    assert.deepEqual(new GF(10).pow(2), new GF(10).mul(new GF(10)));
  });
  it("should add correctly", () => {
    assert.deepEqual(new GF(0b111).add(new GF(0b1010)), new GF(0b1101));
  });
  it("should divide correctly", () => {
    assert.deepEqual(new GF(7).div(new GF(7)), new GF(1));
  });
});
