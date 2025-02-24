import { DOMParser, initParser } from "@b-fuze/deno-dom/wasm-noinit";
import { retry } from "@std/async";
import { textToSha256Hex } from "../../util.ts";
import type { S3Options } from "../types.ts";

interface Options extends S3Options {
  s3Key: string;
  headers?: Headers;
}

export async function s3CreateMultipartUpload(options: Options) {
  const {
    bucket,
    s3Key,
    signer,
    headers = new Headers(),
    retryOptions = {},
  } = options;
  const url = new URL(`https://${bucket}.s3.amazonaws.com/${s3Key}`);
  url.searchParams.set("uploads", "");

  headers.set("x-amz-content-sha256", await textToSha256Hex(""));

  const req = new Request(url, { method: "post", headers });

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
