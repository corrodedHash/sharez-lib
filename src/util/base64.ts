export interface Base64Options {
  extra_chars: string
  padding: boolean
}

function createReplacementDict(
  from: string,
  to: string
): { [k: string]: string } {
  const replacement_chars = to + from.substring(to.length)
  const replacement_dict = Object.fromEntries(
    [...from].map((v, index) => [v, replacement_chars[index]])
  )
  return replacement_dict
}

function characterReplace(from: string, to: string, input: string): string {
  const replacement_dict = createReplacementDict(from, to)
  return input.replaceAll(
    new RegExp(`[${from}]`, "g"),
    (x) => replacement_dict[x]
  )
}

export function fromBase64String(
  input: string,
  options?: Partial<Base64Options>
): Uint8Array {
  if (options !== undefined && options.extra_chars !== undefined) {
    input = characterReplace(options.extra_chars, "+/=", input)
  }
  if (globalThis.atob !== undefined) {
    const raw_base64 = globalThis.atob(input)
    return Uint8Array.from([...raw_base64].map((v) => v.charCodeAt(0)))
  } else {
    return Buffer.from(input, "base64")
  }
}

export function toBase64String(
  input: Uint8Array,
  options?: Partial<Base64Options>
): string {
  let encoded
  if (globalThis.btoa !== undefined) {
    encoded = globalThis.btoa(String.fromCharCode(...input))
  } else {
    encoded = Buffer.from(input).toString("base64")
  }
  if (
    options !== undefined &&
    options.padding !== undefined &&
    !options.padding
  ) {
    encoded = encoded.replaceAll("=", "")
  }
  if (options !== undefined && options.extra_chars !== undefined) {
    encoded = characterReplace("+/=", options.extra_chars, encoded)
  }

  return encoded
}
