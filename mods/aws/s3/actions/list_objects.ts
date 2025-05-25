import { fetchWithRetry, toSha256Hex } from "$util";
import { DOMParser, initParser } from "@b-fuze/deno-dom/wasm-noinit";
import type { S3ReqOptions } from "../types.ts";
import { getS3BaseUrl } from "../util.ts";

interface Options extends S3ReqOptions {
  prefix: string;
  maxKeys?: number;
  startAfter?: string;
}

export async function listObjects(options: Options) {
  let continuationToken;
  const s3Keys: string[] = [];

  do {
    const result = await run({ ...options, continuationToken });
    s3Keys.push(...result.s3Keys);
    continuationToken = result.nextContinuationToken;
  } while (continuationToken);

  return s3Keys;
}

interface RunOptions extends Options {
  continuationToken?: string;
}

async function run(options: RunOptions) {
  const {
    bucket,
    prefix,
    maxKeys,
    startAfter,
    continuationToken,
    signer,
    retryOpt,
    accelerated,
  } = options;

  const url = new URL(`${getS3BaseUrl(bucket, accelerated)}?list-type=2`);

  if (prefix) {
    url.searchParams.set("prefix", prefix);
  }

  if (maxKeys) {
    url.searchParams.set("max-keys", maxKeys.toString());
  }

  if (startAfter) {
    url.searchParams.set("start-after", startAfter);
  }

  if (continuationToken) {
    url.searchParams.set("continuation-token", continuationToken);
  }

  const req = new Request(url, {
    method: "get",
    headers: {
      "x-amz-content-sha256": await toSha256Hex(""),
    },
  });

  const signedReq = await signer.sign("s3", req);
  const resp = await fetchWithRetry(signedReq, retryOpt);
  const respText = await resp.text();

  if (!resp.ok) {
    throw new Error(respText);
  }

  await initParser();

  const doc = new DOMParser().parseFromString(respText, "text/html");

  const s3Keys = Array.from(doc.querySelectorAll("Contents Key")).map((el) =>
    el.textContent as string
  );

  const nextContinuationToken = doc.querySelector("NextContinuationToken")
    ?.textContent as string;

  return {
    s3Keys,
    nextContinuationToken,
  };
}
