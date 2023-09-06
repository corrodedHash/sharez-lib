import { fromBase64String, toBase64String } from "./basic"

export const KEY_ALGO: EcKeyImportParams = {
  name: "ECDSA",
  namedCurve: "P-256",
}

const SHRZ_PREFIX = "shrz"

const SIGN_PUBKEY_SHARE_FORMAT = "raw"
const SIGN_HASH = "SHA-256"

const BASE64OPTIONS = { padding: false, extra_chars: "-_" }

function fb64(input: string): Uint8Array {
  return fromBase64String(input, BASE64OPTIONS)
}
function tb64(input: Uint8Array): string {
  return toBase64String(input, BASE64OPTIONS)
}

export class ShareFormatter {
  share_data: Uint8Array
  share_id: number | undefined
  share_requirement: number | undefined
  pubkey: CryptoKey | undefined
  signature: ArrayBuffer | undefined

  constructor(
    share_data: Uint8Array,
    info?: Partial<{
      share_id: number
      share_requirement: number
    }>
  ) {
    this.share_id = info?.share_id
    this.share_requirement = info?.share_requirement
    this.share_data = share_data
  }

  private get_signable_data(): Uint8Array {
    const id_array = this.share_id !== undefined ? [this.share_id] : []
    const req_array =
      this.share_requirement !== undefined ? [this.share_requirement] : []
    return Uint8Array.from(
      id_array.concat(req_array).concat([...this.share_data])
    )
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

  static async fromString(input: string): Promise<ShareFormatter> {
    const base64chars = "a-zA-Z0-9-_"

    const raw_regex = new RegExp(`^[${base64chars}]+$`)
    const raw_match = raw_regex.exec(input)
    if (raw_match !== null) {
      return new ShareFormatter(fb64(raw_match[0]))
    }

    const sharez_regex = new RegExp(
      `^${SHRZ_PREFIX}:(?<share_id>\\d+)(?:u(?<share_req>\\d+))?` +
        `:(?<data>[${base64chars}]+)(?::(?<signature>[${base64chars}]+)(?::(?<pubkey>[${base64chars}]+))?)?$`
    )

    const share_match = sharez_regex.exec(input)
    if (share_match === null) throw new Error("Input not a share")
    if (share_match.groups === undefined)
      throw new Error("Could not match share parts")
    const { share_id, share_req, data, signature, pubkey } = share_match.groups

    const imported_data = fb64(data)
    const imported_share_id = share_id ? parseInt(share_id) : undefined
    const imported_share_req = share_req ? parseInt(share_req) : undefined
    const imported_signature = signature ? fb64(signature) : undefined
    const imported_pubkey = pubkey ? fb64(pubkey) : undefined

    const built_pubkey = imported_pubkey
      ? await crypto.subtle.importKey(
          SIGN_PUBKEY_SHARE_FORMAT,
          imported_pubkey,
          KEY_ALGO,
          true,
          ["verify"]
        )
      : undefined

    const result = new ShareFormatter(imported_data, {
      share_id: imported_share_id,
      share_requirement: imported_share_req,
    })
    result.pubkey = built_pubkey
    result.signature = imported_signature
    return result
  }

  async toString(): Promise<string> {
    if (this.share_id === undefined) {
      return tb64(this.share_data)
    }
    const str_share_id = this.share_id.toString()
    let str_share_req = ""
    if (this.share_requirement !== undefined) {
      str_share_req = "u" + this.share_requirement.toString()
    }
    const str_share_data = tb64(this.share_data)
    const str_signature = this.signature
      ? tb64(new Uint8Array(this.signature))
      : undefined

    const str_pubkey = this.pubkey
      ? tb64(
          new Uint8Array(
            await crypto.subtle.exportKey(SIGN_PUBKEY_SHARE_FORMAT, this.pubkey)
          )
        )
      : undefined

    let result = `${SHRZ_PREFIX}:${str_share_id}${str_share_req}:${str_share_data}`
    if (str_signature !== undefined) {
      result += ":" + str_signature
      if (str_pubkey !== undefined) {
        result += ":" + str_pubkey
      }
    }
    return result
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
