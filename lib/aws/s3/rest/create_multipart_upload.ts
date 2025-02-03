import { DOMParser, initParser } from "@b-fuze/deno-dom/wasm-noinit";
import { retry, type RetryOptions } from "@std/async";
import { AWSSignerV4 } from "deno_aws_sign_v4";
import { textToSha256Hex } from "../../util.ts";
import type { S3Options } from "../types.ts";

interface Options extends S3Options {
  s3Key: string;
  headers?: Headers;
  retryOptions?: RetryOptions;
}

export async function s3CreateMultipartUpload(options: Options) {
  const {
    bucket,
    region,
    credentials,
    s3Key,
    headers = new Headers(),
    retryOptions = {},
  } = options;
  const url = new URL(`https://${bucket}.s3.amazonaws.com/${s3Key}`);
  url.searchParams.set("uploads", "");

  headers.set("x-amz-content-sha256", await textToSha256Hex(""));

  const req = new Request(url, { method: "post", headers });

  const signer = new AWSSignerV4(region, {
    awsAccessKeyId: credentials.accessKeyId,
    awsSecretKey: credentials.secretAccessKey,
  });

  const signedReq = await signer.sign("s3", req);

  const [resp] = await Promise.all([
    retry(() => fetch(signedReq), retryOptions),
    initParser(),
  ]);

  const respText = await resp.text();

  if (!resp.ok) {
    throw new Error(respText);
  }

  const doc = new DOMParser().parseFromString(respText, "text/html");
  const uploadId = doc.querySelector("UploadId")?.textContent;

  if (!uploadId) {
    throw new Error("Missing `uploadId` in AWS response");
  }

  return uploadId;
}
