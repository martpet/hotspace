import { fetchWithRetry, toSha256Hex } from "$util";
import type { S3ReqOptions } from "../types.ts";
import { getS3BaseUrl } from "../util.ts";

export interface GetObjectOptions extends S3ReqOptions {
  s3Key: string;
  head?: boolean;
}

export async function getObject(options: GetObjectOptions) {
  const { s3Key, head, bucket, signer, retryOpt, accelerated } = options;
  const url = `${getS3BaseUrl(bucket, accelerated)}/${s3Key}`;

  const req = new Request(url, {
    method: head ? "head" : "get",
    headers: {
      "x-amz-content-sha256": await toSha256Hex(""),
    },
  });

  const signedReq = await signer.sign("s3", req);
  const resp = await fetchWithRetry(signedReq, retryOpt);

  if (!resp.ok) {
    throw new Error(await resp.json());
  }

  return resp;
}
