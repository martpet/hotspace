import { initParser } from "@b-fuze/deno-dom/wasm-noinit";
import { retry, type RetryOptions } from "@std/async";
import { AWSSignerV4 } from "deno_aws_sign_v4";
import { textToSha256Hex } from "../encode.ts";
import type { S3Options } from "../types.ts";

export interface GetObjectOptions extends S3Options {
  s3Key: string;
  head?: boolean;
  retryOptions?: RetryOptions;
}

export default async function getObject(options: GetObjectOptions) {
  const { s3Key, head, bucket, region, credentials, retryOptions = {} } =
    options;
  const url = `https://${bucket}.s3.amazonaws.com/${s3Key}`;

  const req = new Request(url, {
    method: head ? "head" : "get",
    headers: {
      "x-amz-content-sha256": await textToSha256Hex(""),
    },
  });

  const signer = new AWSSignerV4(region, {
    awsAccessKeyId: credentials.accessKeyId,
    awsSecretKey: credentials.secretAccessKey,
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
