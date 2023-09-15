import { describe, it } from "mocha"
import { assert } from "chai"
import type { BarycentricHandler } from "./barycentric"
import { BarycentricPolynomial } from "./barycentric"

function gcd(a: number, b: number): number {
  if (isNaN(a) || isNaN(b)) {
    throw new Error("GCD cannot handle NaN floats")
  }
  a = Math.abs(a)
  b = Math.abs(b)
  if (b === 0) {
    return a
  }
  return gcd(b, a % b)
}
function reduceRational(rational: Rational): Rational {
  const g = gcd(rational.num, rational.denom)
  return { num: rational.num / g, denom: rational.denom / g }
}

type Rational = { num: number; denom: number }
const RationalHandler: BarycentricHandler<Rational> = {
  add: (a, b) => {
    const denom_gcd = gcd(a.denom, b.denom)
    const common_denom = (a.denom * b.denom) / denom_gcd
    const new_a_num = (a.num * common_denom) / a.denom
    const new_b_num = (b.num * common_denom) / b.denom
    return reduceRational({ num: new_a_num + new_b_num, denom: common_denom })
  },
  sub: (a, b) => {
    const denom_gcd = gcd(a.denom, b.denom)
    const common_denom = (a.denom * b.denom) / denom_gcd
    const new_a_num = (a.num * common_denom) / a.denom
    const new_b_num = (b.num * common_denom) / b.denom
    return reduceRational({ num: new_a_num - new_b_num, denom: common_denom })
  },
  div: (a, b) =>
    reduceRational({ num: a.num * b.denom, denom: a.denom * b.num }),
  mul: (a, b) =>
    reduceRational({ num: a.num * b.num, denom: a.denom * b.denom }),
  zero: () => ({ num: 0, denom: 1 }),
  one: () => ({ num: 1, denom: 1 }),
  eq: (a, b) => a.num === b.num && a.denom === b.denom,
}

describe("Barycentric Polynomial", () => {
  function testFunction(
    x_values: number[],
    y_values: number[],
    degree: number,
    name: string
  ) {
    describe(name, () => {
      const x_values_rational = x_values.map(
        (v) => ({ num: v, denom: 1 } as Rational)
      )
      const y_values_rational = y_values.map(
        (v) => ({ num: v, denom: 1 } as Rational)
      )
      const poly = BarycentricPolynomial.interpolate(
        x_values_rational.slice(0, degree),
        y_values_rational.slice(0, degree),
        RationalHandler
      )
      x_values_rational.forEach((v, index) => {
        it(`evaluates ${v.num} correctly`, () => {
          assert.deepEqual(poly.evaluate(v), y_values_rational[index])
        })
      })
    })
  }

  // f(x) = 42
  testFunction([7, 8], [42, 42], 1, "Constant")

  // f(x) = 13x + 4
  testFunction([0, 1, 2, 3, 4], [4, 17, 30, 43, 56], 2, "Linear")

  // f(x) = 7x^5 + 4x^4 + 17x^3 - 12x^2 + x - 19
  testFunction(
    [1, 2, 3, 4, 5, 6, 7, 0],
    [-2, 359, 2360, 9073, 26186, 62843, 132484, -19],
    6,
    "Quintic"
  )
})
