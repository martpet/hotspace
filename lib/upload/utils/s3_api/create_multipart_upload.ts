import { DOMParser, initParser } from "@b-fuze/deno-dom/wasm-noinit";
import { retry, type RetryOptions } from "@std/async";
import { DAY } from "@std/datetime";
import { HEADER } from "@std/http";
import { AWSSignerV4 } from "deno_aws_sign_v4";
import { textToSha256Hex } from "../encode.ts";
import type { S3Options } from "../types.ts";

interface Options extends S3Options {
  s3Key: string;
  fileType: string;
  retryOptions?: RetryOptions;
}

export async function createMultipartUpload(options: Options) {
  const { bucket, region, credentials, s3Key, fileType, retryOptions = {} } =
    options;
  const url = new URL(`https://${bucket}.s3.amazonaws.com/${s3Key}`);

  url.searchParams.set("uploads", "");

  const req = new Request(url, {
    method: "post",
    headers: {
      [HEADER.ContentType]: fileType,
      [HEADER.CacheControl]: `public, max-age=${DAY * 359 / 1000}, immutable`,
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
