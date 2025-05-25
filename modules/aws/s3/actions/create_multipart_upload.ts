import { fetchWithRetry, toSha256Hex } from "$util";
import { DOMParser, initParser } from "@b-fuze/deno-dom/wasm-noinit";
import type { S3ReqOptions } from "../types.ts";
import { getS3BaseUrl } from "../util.ts";

interface Options extends S3ReqOptions {
  s3Key: string;
  headers?: Headers;
}

export async function createMultipartUpload(options: Options) {
  const {
    bucket,
    s3Key,
    signer,
    headers = new Headers(),
    retryOpt,
    accelerated,
  } = options;
  const url = new URL(`${getS3BaseUrl(bucket, accelerated)}/${s3Key}`);
  url.searchParams.set("uploads", "");

  headers.set("x-amz-content-sha256", await toSha256Hex(""));

  const req = new Request(url, {
    method: "post",
    headers,
  });

  const signedReq = await signer.sign("s3", req);
  const resp = await fetchWithRetry(signedReq, retryOpt);
  const respText = await resp.text();

  if (!resp.ok) {
    throw new Error(respText);
  }

  await initParser();

  const doc = new DOMParser().parseFromString(respText, "text/html");
  const uploadId = doc.querySelector("UploadId")?.textContent;

  if (!uploadId) {
    throw new Error("Missing `uploadId` in AWS response");
  }

  return uploadId;
}
