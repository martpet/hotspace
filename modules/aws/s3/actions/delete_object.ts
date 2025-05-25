import { fetchWithRetry, toSha256Hex } from "$util";
import type { S3ReqOptions } from "../types.ts";
import { getS3BaseUrl } from "../util.ts";

interface Options extends S3ReqOptions {
  s3Key: string;
}

export async function deleteObject(options: Options) {
  const { s3Key, bucket, signer, retryOpt, accelerated } = options;
  const url = `${getS3BaseUrl(bucket, accelerated)}/${s3Key}`;

  const req = new Request(url, {
    method: "DELETE",
    headers: {
      "x-amz-content-sha256": await toSha256Hex(""),
    },
  });

  const signedReq = await signer.sign("s3", req);
  const resp = await fetchWithRetry(signedReq, retryOpt);

  if (!resp.ok && resp.status !== 404) {
    const respText = await resp.text();
    throw new Error(respText);
  }
}
