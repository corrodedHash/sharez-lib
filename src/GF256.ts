const characteristic_polynomial = 0b100011011

/**
 * Returns the index of the most-significant bit set to 1 in `n`
 * If `n === 0`, returns 0
 */
function highest_set_bit(n: number): number {
  if (n === 0) {
    return 0
  }
  return Math.floor(Math.log2(n))
}

/**
 * Reduces the number n as a polynomial in binary space
 * @param n The binary polynomial, where `n & 1` is the coefficient of the term x^0
 * @returns The binary polynomial, reduced with the characteristic_polynomial of GF256
 */
function reduce_GF(n: number): number {
  while (highest_set_bit(n) >= 8) {
    n ^= characteristic_polynomial << (highest_set_bit(n) - 8)
  }
  return n
}

export class GF256Element {
  bits: number

  constructor(n: number) {
    this.bits = reduce_GF(n)
  }

  clone(): GF256Element {
    return new GF256Element(this.bits)
  }

  add(other: GF256Element): GF256Element {
    return new GF256Element(this.bits ^ other.bits)
  }

  mul(other: GF256Element): GF256Element {
    let res = 0
    let tmp = this.bits
    let power = 0
    while (tmp > 0) {
      if (tmp % 2 == 1) {
        res ^= other.bits << power
      }
      power += 1
      tmp = tmp >> 1
    }
    return new GF256Element(reduce_GF(res))
  }

  div(divisor: GF256Element): GF256Element {
    return this.mul(divisor.inverse())
  }

  inverse(): GF256Element {
    return this.pow(254)
  }

  pow(exponent: number): GF256Element {
    let result = new GF256Element(1)
    let power = this.clone()
    while (exponent > 0) {
      if (exponent % 2 == 1) {
        result = result.mul(power)
      }
      power = power.mul(power)
      exponent = exponent >> 1
    }
    return result
  }
}
