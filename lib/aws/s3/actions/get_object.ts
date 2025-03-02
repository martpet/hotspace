import { toSha256Hex } from "$util";
import { fetchWithRetry } from "../../util.ts";
import type { S3ReqOptions } from "../types.ts";

export interface GetObjectOptions extends S3ReqOptions {
  s3Key: string;
  head?: boolean;
}

export default async function getObject(options: GetObjectOptions) {
  const { s3Key, head, bucket, signer } = options;
  const url = `https://${bucket}.s3.amazonaws.com/${s3Key}`;

  const req = new Request(url, {
    method: head ? "head" : "get",
    headers: {
      "x-amz-content-sha256": await toSha256Hex(""),
    },
  });

  const signedReq = await signer.sign("s3", req);
  const resp = await fetchWithRetry(signedReq);

  if (!resp.ok) {
    throw new Error(await resp.json());
  }

  return Object.fromEntries(resp.headers.entries());
}
