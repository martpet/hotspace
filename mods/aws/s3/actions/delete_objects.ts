import { fetchWithRetry, toSha256Base64, toSha256Hex } from "$util";
import { newQueue } from "@henrygd/queue";
import { chunk } from "@std/collections";
import type { S3ReqOptions } from "../types.ts";
import { getS3BaseUrl } from "../util.ts";

export interface Options extends S3ReqOptions {
  s3Keys: string[];
}

export function deleteObjects(options: Options) {
  const chunks = chunk(options.s3Keys, 1000);
  const queue = newQueue(5);

  for (const s3Keys of chunks) {
    queue.add(() => run({ ...options, s3Keys }));
  }

  return queue.done();
}

async function run(options: Options) {
  const { s3Keys, bucket, signer, retryOpt, accelerated } = options;
  const url = `${getS3BaseUrl(bucket, accelerated)}?delete`;

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

  const resp = await fetchWithRetry(signedReq, retryOpt);

  if (!resp.ok) {
    const respText = await resp.text();
    throw new Error(respText);
  }
}
