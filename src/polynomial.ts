import { zero_array } from "./basic"

export type HandlerType<T> = {
  mul: (a: T, b: T) => T
  div: (a: T, b: T) => T
  add: (a: T, b: T) => T
  sub: (a: T, b: T) => T
  zero: () => T
  one: () => T
}

export class Polynomial<T> {
  coefficients: T[]
  handler: HandlerType<T>
  constructor(coefficients: T[], handler: HandlerType<T>) {
    this.coefficients = coefficients
    this.handler = handler
  }

  multiply(other: Polynomial<T>): Polynomial<T> {
    const result_length =
      this.coefficients.length + other.coefficients.length - 1
    const new_coeffs = this.coefficients
      .map((x, x_index) => {
        const r = other.coefficients.map((y) => this.handler.mul(x, y))
        const front = zero_array(x_index).map(this.handler.zero)
        const back = zero_array(
          result_length - other.coefficients.length - x_index
        ).map(this.handler.zero)
        return front.concat(r, back)
      })
      .reduce((a, b) => a.map((v, vi) => this.handler.add(v, b[vi])))
    return new Polynomial(new_coeffs, this.handler)
  }

  add(other: Polynomial<T>): Polynomial<T> {
    const result_coefficients = zero_array(
      Math.max(this.coefficients.length, other.coefficients.length)
    ).map(this.handler.zero)
    for (let i = 0; i < result_coefficients.length; i++) {
      result_coefficients[i] = this.handler.add(
        this.coefficients[i] ?? this.handler.zero(),
        other.coefficients[i] ?? this.handler.zero()
      )
    }
    return new Polynomial(result_coefficients, this.handler)
  }

  evaluate(x: T): T {
    const x_powers = [this.handler.one()]

    this.coefficients.slice(1).forEach(() => {
      x_powers.push(this.handler.mul(x_powers[x_powers.length - 1], x))
    })
    return this.coefficients
      .map((v, i) => this.handler.mul(v, x_powers[i]))
      .reduce((a, b) => this.handler.add(a, b))
  }
}

/**
 * @param x_values X values of the points used for interpolating the polynomial
 * @param y_values Y values of the points used for interpolating the polynomial
 * @returns Polynomial which passes through all provided points
 */
export function interpolate<T>(
  x_values: T[],
  y_values: T[],
  handler: HandlerType<T>
): Polynomial<T> {
  if (x_values.length === 1) {
    return new Polynomial(y_values, handler)
  }
  function lagrange_base(index: number): Polynomial<T> {
    const chosen_x = x_values[index]
    const filtered_x = x_values.filter((_, v_index) => v_index !== index)

    const denominator = filtered_x
      .map((v) => handler.sub(chosen_x, v))
      .reduce((a, b) => handler.mul(a, b))

    const numerator = filtered_x
      .map(
        (v) =>
          new Polynomial(
            [handler.sub(handler.zero(), v), handler.one()],
            handler
          )
      )
      .reduce((a, b) => a.multiply(b))
    const result = numerator.multiply(
      new Polynomial([handler.div(handler.one(), denominator)], handler)
    )
    return result
  }

  const bases = y_values.map((v, index) =>
    lagrange_base(index).multiply(new Polynomial([v], handler))
  )

  return bases.reduce((a, b) => a.add(b))
}
