import { Share } from "./share"

export const KEY_ALGO: EcKeyImportParams = {
  name: "ECDSA",
  namedCurve: "P-256",
}

export const SHRZ_PREFIX = "shrz"

export const SIGN_PUBKEY_SHARE_FORMAT = "raw"
export const SIGN_HASH = "SHA-256"

export interface ShareSignature {
  signature: ArrayBuffer
  pubkey?: CryptoKey
}

function get_signable_data(share: Share): Uint8Array {
  const id_array = share.xValue !== undefined ? [share.xValue] : []
  const req_array = share.requirement !== undefined ? [share.requirement] : []
  return Uint8Array.from(id_array.concat(req_array).concat([...share.yValues]))
}

export async function sign(
  share: Share,
  keypair: CryptoKeyPair
): Promise<ShareSignature> {
  const signature = await crypto.subtle.sign(
    { name: KEY_ALGO.name, hash: { name: SIGN_HASH } },
    keypair.privateKey,
    get_signable_data(share)
  )
  const publicKey = await crypto.subtle.exportKey("spki", keypair.publicKey)
  const pubkey = await crypto.subtle.importKey(
    "spki",
    publicKey,
    KEY_ALGO,
    true,
    ["verify"]
  )

  return { signature: new Uint8Array(signature), pubkey }
}

export async function verify(share: Share, signature: ShareSignature) {
  if (signature.pubkey === undefined) {
    throw new Error("Cannot verify share with no public key information")
  }
  return await crypto.subtle.verify(
    { name: KEY_ALGO.name, hash: { name: SIGN_HASH } },
    signature.pubkey,
    signature.signature,
    get_signable_data(share)
  )
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
