import { DOMParser, initParser } from "@b-fuze/deno-dom/wasm-noinit";
import { retry, type RetryOptions } from "@std/async";
import { AWSSignerV4 } from "deno_aws_sign_v4";
import { textToSha256Hex } from "../encode.ts";
import type { CompletedUpload, S3Options } from "../types.ts";

interface Options extends S3Options, CompletedUpload {
  retryOptions?: RetryOptions;
}

export async function completeMultipartUpload(options: Options) {
  const {
    s3Key,
    uploadId,
    checksum,
    finishedParts,
    bucket,
    region,
    credentials,
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
  const completeTag = doc.querySelector("CompleteMultipartUploadResult");

  if (!completeTag) {
    throw new Error(respText);
  }
}
