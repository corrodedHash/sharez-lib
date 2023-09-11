import { KEY_ALGO, SHRZ_PREFIX, SIGN_PUBKEY_SHARE_FORMAT, Share } from "./share"
import { fromBase64String, toBase64String } from "./util/base64"

const BASE64OPTIONS = { padding: false, extra_chars: "-_" }

function fb64(input: string): Uint8Array {
  return fromBase64String(input, BASE64OPTIONS)
}
function tb64(input: Uint8Array): string {
  return toBase64String(input, BASE64OPTIONS)
}

export class ShareEncoder {
  async encode(share: Share): Promise<string> {
    if (share.xValue === undefined) {
      return tb64(share.yValues)
    }
    const str_share_id = share.xValue.toString()
    let str_share_req = ""
    if (share.requirement !== undefined) {
      str_share_req = "u" + share.requirement.toString()
    }
    const str_share_data = tb64(share.yValues)
    const str_signature = share.signature
      ? tb64(new Uint8Array(share.signature))
      : undefined

    const str_pubkey = share.pubkey
      ? tb64(
          new Uint8Array(
            await crypto.subtle.exportKey(
              SIGN_PUBKEY_SHARE_FORMAT,
              share.pubkey
            )
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

export class ShareDecoder {
  async decode(input: string): Promise<Share> {
    const base64chars = "a-zA-Z0-9-_"

    const raw_regex = new RegExp(`^[${base64chars}]+$`)
    const raw_match = raw_regex.exec(input)
    if (raw_match !== null) {
      return new Share(fb64(raw_match[0]))
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

    const result = new Share(imported_data, {
      xValue: imported_share_id,
      requirement: imported_share_req,
    })
    result.pubkey = built_pubkey
    result.signature = imported_signature
    return result
  }
}
