export interface Share {
  /** The y-values for each byte in the SSS */
  yValues: Uint8Array
  /** The x value used for each byte */
  xValue?: number
  /** The degree of the polynomial in the SSS */
  requirement?: number
}
