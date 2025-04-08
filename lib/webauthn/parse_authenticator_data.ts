import { encodeBase64Url } from "@std/encoding";

export interface ParsedAuthenticatorData {
  rpIdHash: Uint8Array;
  flags: Record<"up" | "uv" | "be" | "bs" | "at" | "ed", boolean>;
  counter: number;
  credId?: string;
  aaguid?: string;
}

export function parseAuthenticatorData(authData: Uint8Array) {
  let offset = 0;
  const rpIdHash = authData.slice(offset, offset += 32);
  const flagsBytes = authData.slice(offset, offset += 1);
  const flagsNum = flagsBytes[0];
  const flags = convertFlags(flagsNum);
  const counterBytes = authData.slice(offset, offset += 4);
  const counter = new DataView(counterBytes.buffer).getUint32(0);
  const result: ParsedAuthenticatorData = {
    rpIdHash,
    flags,
    counter,
  };
  if (flags.at) {
    const aaguid = authData.slice(offset, offset += 16);
    const credIdLenBytes = authData.slice(offset, offset += 2);
    const credIdLen = new DataView(credIdLenBytes.buffer).getUint16(0);
    const credId = authData.slice(offset, offset += credIdLen);
    result.credId = encodeBase64Url(credId);
    result.aaguid = convertAaguid(aaguid);
  }
  return result;
}

function convertFlags(flags: number) {
  return {
    up: !!(flags & (1 << 0)),
    uv: !!(flags & (1 << 2)),
    be: !!(flags & (1 << 3)),
    bs: !!(flags & (1 << 4)),
    at: !!(flags & (1 << 6)),
    ed: !!(flags & (1 << 7)),
  };
}

function convertAaguid(aaguidBytes: Uint8Array) {
  const hex = Array.from(aaguidBytes).map((byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}
