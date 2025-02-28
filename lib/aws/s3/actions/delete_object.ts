import { toSha256Hex } from "$util";
import { retry } from "@std/async";
import type { S3ReqOptions } from "../types.ts";

interface Options extends S3ReqOptions {
  s3Key: string;
}

export async function deleteObject(options: Options) {
  const { s3Key, bucket, signer, retryOpt = {} } = options;
  const url = `https://${bucket}.s3.amazonaws.com/${s3Key}`;

  const req = new Request(url, {
    method: "DELETE",
    headers: {
      "x-amz-content-sha256": await toSha256Hex(""),
    },
  });

  const signedReq = await signer.sign("s3", req);

  const resp = await retry(() => fetch(signedReq), retryOpt);

  if (!resp.ok && resp.status !== 404) {
    const respText = await resp.text();
    throw new Error(respText);
  }
}
