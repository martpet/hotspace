import { toSha256Base64, toSha256Hex } from "$util";
import { chunk } from "@std/collections";
import { fetchWithRetry } from "../../util.ts";
import type { S3ReqOptions } from "../types.ts";

export interface Options extends S3ReqOptions {
  s3Keys: string[];
}

export async function deleteObjects(options: Options) {
  const chunks = chunk(options.s3Keys, 1000);

  for (const s3Keys of chunks) {
    await run({ ...options, s3Keys });
  }
}

async function run(options: Options) {
  const { s3Keys, bucket, signer } = options;
  const url = `https://${bucket}.s3.amazonaws.com/?delete`;

  let body = '<Delete xmlns="http://s3.amazonaws.com/doc/2006-03-01/">';
  body += "<Quiet>boolean</Quiet>";

  for (const key of s3Keys) {
    body += `
      <Object>
        <Key>${key}</Key>
      </Object>
    `;
  }

  body += "</Delete>";

  const req = new Request(url, {
    method: "post",
    body,
    headers: {
      "x-amz-content-sha256": await toSha256Hex(body),
      "x-amz-checksum-sha256": await toSha256Base64(body),
    },
  });

  const signedReq = await signer.sign("s3", req);

  const resp = await fetchWithRetry(signedReq);

  if (!resp.ok) {
    const respText = await resp.text();
    throw new Error(respText);
  }
}
