import type { ArithmeticHandler } from "./polynomial"
import { GF256Element } from "./GF256"
import { Share } from "./share"
import { BarycentricPolynomial, EqualityHandler } from "./barycentric"

const GF256Handler: ArithmeticHandler<GF256Element> &
  EqualityHandler<GF256Element> = {
  add: (a, b) => a.add(b),
  sub: (a, b) => a.add(b),
  mul: (a, b) => a.mul(b),
  div: (a, b) => a.div(b),
  zero: () => new GF256Element(0),
  one: () => new GF256Element(1),
  eq: (a, b) => a.bits == b.bits,
}

class GF256Polynomial extends BarycentricPolynomial<GF256Element> {
  constructor(
    points: { x: GF256Element; y: GF256Element; weight: GF256Element }[]
  ) {
    super(points, GF256Handler)
  }
}

export class SSS {
  polynomials: GF256Polynomial[]

  constructor(polynomials: GF256Polynomial[]) {
    this.polynomials = polynomials
  }

  toJSON(): { x: number; y: number; weight: number }[][] {
    const arrayForm = this.polynomials.map((v) =>
      v.points.map((e) => ({ x: e.x.bits, y: e.y.bits, weight: e.weight.bits }))
    )
    return arrayForm
  }

  static from_json(json: string): SSS {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) throw new Error("Json is not an array")
    const polynomials = parsed.map((v, index) => {
      if (!Array.isArray(v))
        throw new Error(`Polynomial #${index} is not an array`)
      const coefficients = v.map((e, pindex) => {
        const x = e.x
        const y = e.y
        const weight = e.weight
        if (typeof x !== "number")
          throw new Error(`X #${index}/${pindex} not a number`)
        if (typeof y !== "number")
          throw new Error(`Y #${index}/${pindex} not a number`)
        if (typeof weight !== "number")
          throw new Error(`Weight #${index}/${pindex} not a number`)
        return {
          x: new GF256Element(x),
          y: new GF256Element(y),
          weight: new GF256Element(weight),
        }
      })
      return new GF256Polynomial(coefficients)
    })
    return new SSS(polynomials)
  }
  static from_secret(secret: Uint8Array, threshold: number): SSS {
    function generateCoefficients(secret_byte: number) {
      const random_points = new Uint8Array(threshold - 1)
      crypto.getRandomValues(random_points)
      const galois_coefficients = Array.from(random_points).map(
        (v) => new GF256Element(v)
      )
      const y_values = [new GF256Element(secret_byte), ...galois_coefficients]
      const x_values = [...new Array(threshold).keys()].map(
        (v) => new GF256Element(v)
      )
      return GF256Polynomial.interpolate(x_values, y_values, GF256Handler)
    }
    const polynomials = Array.from(secret).map(generateCoefficients)
    return new SSS(polynomials)
  }

  static from_shares(shares: Share[]): SSS {
    if (shares.length < 1) {
      throw new Error("Empty share array")
    }
    // `shares[0]` is the share of the first user, `transposed_shares[0]` is the first byte of each share
    const transposed_shares = Array.from(shares[0].yValues).map((_, colIndex) =>
      shares.map((row) => row.yValues[colIndex])
    )

    const share_ids = shares
      .map((v) => v.xValue)
      .filter((v): v is Exclude<typeof v, undefined> => v !== undefined)
    if (share_ids.length !== shares.length) {
      throw new Error("Share did not contain xValue")
    }
    const polynomials = transposed_shares.map((share_bytes) =>
      GF256Polynomial.interpolate(
        share_ids.map((shareID) => new GF256Element(shareID)),
        share_bytes.map((shareByte) => new GF256Element(shareByte)),
        GF256Handler
      )
    )
    return new SSS(polynomials)
  }

  private get_x_values(x: number): Uint8Array {
    const gf_x = new GF256Element(x)
    return Uint8Array.from(this.polynomials.map((v) => v.evaluate(gf_x).bits))
  }

  share(x: number): Share {
    if (x < 1) {
      // Make sure the secret does not get leaked as a share
      throw new Error(
        "To retrieve secret, call `secret` property. `x` must be non-zero positive"
      )
    }
    return {
      yValues: this.get_x_values(x),
      xValue: x,
      requirement: this.requiredShares,
    }
  }

  public get secret(): Uint8Array {
    return this.get_x_values(0)
  }

  public get requiredShares(): number {
    return this.polynomials[0].points.length
  }
}
