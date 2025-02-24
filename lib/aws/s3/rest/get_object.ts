import { initParser } from "@b-fuze/deno-dom/wasm-noinit";
import { retry } from "@std/async";
import { textToSha256Hex } from "../../util.ts";
import type { S3Options } from "../types.ts";

export interface GetObjectOptions extends S3Options {
  s3Key: string;
  head?: boolean;
}

export default async function s3GetObject(options: GetObjectOptions) {
  const { s3Key, head, bucket, signer, retryOptions = {} } = options;
  const url = `https://${bucket}.s3.amazonaws.com/${s3Key}`;

  const req = new Request(url, {
    method: head ? "head" : "get",
    headers: {
      "x-amz-content-sha256": await textToSha256Hex(""),
    },
  });

  const signedReq = await signer.sign("s3", req);

  const [resp] = await Promise.all([
    retry(() => fetch(signedReq), retryOptions),
    initParser(),
  ]);

  if (!resp.ok) {
    throw new Error(await resp.json());
  }

  return Object.fromEntries(resp.headers.entries());
}
