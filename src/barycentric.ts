import { ArithmeticHandler } from "./polynomial"

export type EqualityHandler<T> = {
  eq: (a: T, b: T) => boolean
}

export type BarycentricHandler<T> = EqualityHandler<T> & ArithmeticHandler<T>

export class BarycentricPolynomial<T> {
  points: { x: T; y: T; weight: T }[]
  handler: BarycentricHandler<T>
  constructor(
    points: { x: T; y: T; weight: T }[],
    handler: BarycentricHandler<T>
  ) {
    this.points = points
    this.handler = handler
  }
  static interpolate<T>(
    x_values: T[],
    y_values: T[],
    handler: BarycentricHandler<T>
  ) {
    const weights = x_values.map((j_value, j_index) => {
      const inverse = x_values
        .filter((m_value, m_index) => j_index !== m_index)
        .map((m_value) => handler.sub(j_value, m_value))
        .reduce((a, b) => handler.mul(a, b), handler.one())
      return handler.div(handler.one(), inverse)
    })
    const points = x_values.map((x, index) => {
      const y = y_values[index]
      const weight = weights[index]
      return { x, y, weight }
    })
    return new BarycentricPolynomial(points, handler)
  }
  evaluate(x: T): T {
    const foundPoint = this.points.find((v) => this.handler.eq(v.x, x))
    if (foundPoint !== undefined) {
      return foundPoint.y
    }
    const summands = this.points.map((v) => {
      const step_1 = this.handler.sub(x, v.x)
      const step_2 = this.handler.div(v.weight, step_1)
      return [this.handler.mul(step_2, v.y), step_2] as [T, T]
    })
    const [num, denom] = summands.reduce(
      ([prev_num, prev_denom], [num, denom]) => {
        return [
          this.handler.add(prev_num, num),
          this.handler.add(prev_denom, denom),
        ]
      }
    )
    return this.handler.div(num, denom)
  }
}
