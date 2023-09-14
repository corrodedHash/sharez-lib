import { HandlerType } from "./polynomial"

export class BarycentricPolynomial<T> {
  points: { x: T; y: T; weight: T }[]
  handler: HandlerType<T>
  constructor(points: { x: T; y: T; weight: T }[], handler: HandlerType<T>) {
    this.points = points
    this.handler = handler
  }
  static interpolate<T>(x_values: T[], y_values: T[], handler: HandlerType<T>) {
    const weights = x_values.map((j_value, j_index) => {
      const inverse = x_values
        .filter((m_value, m_index) => j_index !== m_index)
        .map((m_value) => handler.mul(j_value, m_value))
        .reduce((a, b) => handler.mul(a, b))
      return handler.div(handler.one(), inverse)
    })
    const points = x_values.map((x, index) => {
      const y = y_values[index]
      const weight = weights[index]
      return { x, y, weight }
    })
    return new BarycentricPolynomial(points, handler)
  }
}
