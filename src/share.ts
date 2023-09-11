export const KEY_ALGO: EcKeyImportParams = {
  name: "ECDSA",
  namedCurve: "P-256",
}

export const SHRZ_PREFIX = "shrz"

export const SIGN_PUBKEY_SHARE_FORMAT = "raw"
export const SIGN_HASH = "SHA-256"

export class Share {
  /** The y-values for each byte in the SSS */
  yValues: Uint8Array
  /** The x value used for each byte */
  xValue: number | undefined
  /** The degree of the polynomial in the SSS */
  requirement: number | undefined
  pubkey: CryptoKey | undefined
  signature: ArrayBuffer | undefined

  constructor(
    yValues: Uint8Array,
    info?: Partial<{
      xValue: number
      requirement: number
    }>
  ) {
    this.xValue = info?.xValue
    this.requirement = info?.requirement
    this.yValues = yValues
  }

  private get_signable_data(): Uint8Array {
    const id_array = this.xValue !== undefined ? [this.xValue] : []
    const req_array = this.requirement !== undefined ? [this.requirement] : []
    return Uint8Array.from(id_array.concat(req_array).concat([...this.yValues]))
  }

  async sign(keypair: CryptoKeyPair) {
    const signature = await crypto.subtle.sign(
      { name: KEY_ALGO.name, hash: { name: SIGN_HASH } },
      keypair.privateKey,
      this.get_signable_data()
    )
    const publicKey = await crypto.subtle.exportKey("spki", keypair.publicKey)
    const pubkey = await crypto.subtle.importKey(
      "spki",
      publicKey,
      KEY_ALGO,
      true,
      ["verify"]
    )

    this.signature = new Uint8Array(signature)
    this.pubkey = pubkey
  }

  async verify(pubkey?: CryptoKey) {
    if (this.signature === undefined) {
      throw new Error("Cannot verify share with no signature")
    }
    const used_pubkey = this.pubkey || pubkey
    if (used_pubkey === undefined) {
      throw new Error("Cannot verify share with no public key information")
    }
    return await crypto.subtle.verify(
      { name: KEY_ALGO.name, hash: { name: SIGN_HASH } },
      used_pubkey,
      this.signature,
      this.get_signable_data()
    )
  }
}

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await crypto.subtle.generateKey(KEY_ALGO, true, [
    "sign",
    "verify",
  ])
  return keyPair
}

async function getPublicKey(privateKey: CryptoKey): Promise<CryptoKey> {
  const x = await crypto.subtle.exportKey("jwk", privateKey)
  delete x.d
  x.key_ops = ["verify"]
  return await crypto.subtle.importKey("jwk", x, KEY_ALGO, true, ["verify"])
}

export async function fromRawPrivateKey(
  privateKey_raw: Uint8Array
): Promise<CryptoKeyPair> {
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKey_raw,
    KEY_ALGO,
    true,
    ["sign"]
  )
  const publicKey = await getPublicKey(privateKey)

  return { privateKey, publicKey }
}
