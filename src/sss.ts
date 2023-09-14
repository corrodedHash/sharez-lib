import type { HandlerType } from "./polynomial"
import { Polynomial } from "./polynomial"
import { GF256Element } from "./GF256"
import { Share } from "./share"

const GF256Handler: HandlerType<GF256Element> = {
  add: (a, b) => a.add(b),
  sub: (a, b) => a.add(b),
  mul: (a, b) => a.mul(b),
  div: (a, b) => a.div(b),
  zero: () => new GF256Element(0),
  one: () => new GF256Element(1),
}

class GF256Polynomial extends Polynomial<GF256Element> {
  constructor(coefficients: GF256Element[]) {
    super(coefficients, GF256Handler)
  }
}

export class SSS {
  polynomials: GF256Polynomial[]

  constructor(polynomials: GF256Polynomial[]) {
    this.polynomials = polynomials
  }

  toJSON(): number[][] {
    const arrayForm = this.polynomials.map((v) =>
      v.coefficients.map((e) => e.bits)
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
        if (typeof e !== "number")
          throw new Error(`Coefficient #${index}/${pindex} not a number`)
        return new GF256Element(e)
      })
      return new GF256Polynomial(coefficients)
    })
    return new SSS(polynomials)
  }
  static from_secret(secret: Uint8Array, threshold: number): SSS {
    function generateCoefficients(secret_byte: number) {
      const coefficients = new Uint8Array(threshold - 1)
      crypto.getRandomValues(coefficients)
      const galois_coefficients = Array.from(coefficients).map(
        (v) => new GF256Element(v)
      )
      return [new GF256Element(secret_byte), ...galois_coefficients]
    }
    const polynomials = Array.from(secret)
      .map(generateCoefficients)
      .map((v) => new GF256Polynomial(v))
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
    return new Share(this.get_x_values(x), {
      xValue: x,
      requirement: this.requiredShares,
    })
  }

  public get secret(): Uint8Array {
    return this.get_x_values(0)
  }

  public get requiredShares(): number {
    return this.polynomials[0].coefficients.length
  }
}
