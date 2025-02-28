import { toSha256Hex } from "$util";
import { retry } from "@std/async";
import type { S3ReqOptions } from "../types.ts";

export interface GetObjectOptions extends S3ReqOptions {
  s3Key: string;
  head?: boolean;
}

export default async function getObject(options: GetObjectOptions) {
  const { s3Key, head, bucket, signer, retryOpt = {} } = options;
  const url = `https://${bucket}.s3.amazonaws.com/${s3Key}`;

  const req = new Request(url, {
    method: head ? "head" : "get",
    headers: {
      "x-amz-content-sha256": await toSha256Hex(""),
    },
  });

  const signedReq = await signer.sign("s3", req);
  const resp = await retry(() => fetch(signedReq), retryOpt);

  if (!resp.ok) {
    throw new Error(await resp.json());
  }

  return Object.fromEntries(resp.headers.entries());
}
