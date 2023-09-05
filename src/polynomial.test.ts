import { describe, it } from "mocha";
import { assert } from "chai";
import type { HandlerType } from "./polynomial";
import { Polynomial, interpolate } from "./polynomial";

const IntegerHandler: HandlerType<number> = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  div: (a, b) => a / b,
  mul: (a, b) => a * b,
  zero: () => 0,
  one: () => 1,
};

describe("Polynomial", () => {
  const xp1 = new Polynomial([1, 1], IntegerHandler);
  const xm1 = new Polynomial([1, -1], IntegerHandler);
  const b = new Polynomial([0, -1, 0, 1], IntegerHandler);
  it("multiplies quadratic", () => {
    assert.deepEqual(
      xp1.multiply(xm1),
      new Polynomial([1, 0, -1], IntegerHandler)
    );
  });
  it("multiplies cubic", () => {
    assert.deepEqual(
      b.multiply(new Polynomial([2], IntegerHandler)),
      new Polynomial([0, -2, 0, 2], IntegerHandler)
    );
  });
  it("evaluates", () => {
    assert.equal(xp1.evaluate(0), 1);
  });
  it("interpolates", () => {
    assert.deepEqual(
      interpolate([-1, 0, 1], [2, 1, 2], IntegerHandler),
      new Polynomial([1, 0, 1], IntegerHandler)
    );
  });
  it("interpolates cubic", () => {
    const cubic = interpolate([-1, 0, 1, 2], [-1, 0, 1, 8], IntegerHandler);
    cubic.coefficients = cubic.coefficients.map(Math.round);
    assert.deepEqual(cubic, new Polynomial([0, 0, 0, 1], IntegerHandler));
  });
});
