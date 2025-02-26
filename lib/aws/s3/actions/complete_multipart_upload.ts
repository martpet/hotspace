import { DOMParser, initParser } from "@b-fuze/deno-dom/wasm-noinit";
import { retry } from "@std/async";
import { textToSha256Hex } from "../../util.ts";
import type { CompletedUpload, S3ReqOptions } from "../types.ts";

interface Options extends S3ReqOptions, CompletedUpload {
}

export async function completeMultipartUpload(options: Options) {
  const {
    s3Key,
    uploadId,
    checksum,
    finishedParts,
    bucket,
    signer,
    retryOptions = {},
  } = options;
  const url = new URL(`https://${bucket}.s3.amazonaws.com/${s3Key}`);

  url.searchParams.set("uploadId", uploadId);

  let body =
    '<CompleteMultipartUpload xmlns="http://s3.amazonaws.com/doc/2006-03-01/">';

  const sortedParts = finishedParts.sort((a, b) => a.partNumber - b.partNumber);

  for (const { etag, partNumber } of sortedParts) {
    body += `
      <Part>
        <ETag>${etag}</ETag>
        <PartNumber>${partNumber}</PartNumber>
      </Part>
    `;
  }
  body += "</CompleteMultipartUpload>";

  const req = new Request(url, {
    method: "post",
    body,
    headers: {
      "x-amz-content-sha256": await textToSha256Hex(body),
      "x-amz-checksum-sha256": checksum,
    },
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
  const completeTag = doc.querySelector("CompleteMultipartUploadResult");

  if (!completeTag) {
    throw new Error(respText);
  }
}
