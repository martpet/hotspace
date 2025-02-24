import { initParser } from "@b-fuze/deno-dom/wasm-noinit";
import { retry } from "@std/async";
import { AWSSignerV4 } from "deno_aws_sign_v4";
import { textToSha256Hex } from "../../util.ts";
import type { S3Options } from "../types.ts";

interface Options extends S3Options {
  s3Key: string;
  signer: AWSSignerV4;
}

export async function s3DeleteObject(options: Options) {
  const { s3Key, bucket, signer, retryOptions = {} } = options;
  const url = `https://${bucket}.s3.amazonaws.com/${s3Key}`;

  const req = new Request(url, {
    method: "DELETE",
    headers: {
      "x-amz-content-sha256": await textToSha256Hex(""),
    },
  });

  const signedReq = await signer.sign("s3", req);

  const [resp] = await Promise.all([
    retry(() => fetch(signedReq), retryOptions),
    initParser(),
  ]);

  if (!resp.ok && resp.status !== 404) {
    throw new Error(await resp.json());
  }
}
