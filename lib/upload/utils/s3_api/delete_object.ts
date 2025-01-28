import { initParser } from "@b-fuze/deno-dom/wasm-noinit";
import { retry, type RetryOptions } from "@std/async";
import { AWSSignerV4 } from "deno_aws_sign_v4";
import { textToSha256Hex } from "../encode.ts";
import type { S3Options } from "../types.ts";

interface Options extends S3Options {
  s3Key: string;
  retryOptions?: RetryOptions;
}

export default async function deleteObject(options: Options) {
  const { s3Key, bucket, region, credentials, retryOptions = {} } = options;
  const url = `https://${bucket}.s3.amazonaws.com/${s3Key}`;

  const req = new Request(url, {
    method: "DELETE",
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
