import { fetchWithRetry, toSha256Hex } from "$util";
import { HEADER } from "@std/http/unstable-header";
import type { AwsActionBase } from "../../types.ts";
import { getSnsBaseUrl } from "../util.ts";

interface Options extends AwsActionBase {
  topicArn: string;
  region: string;
  message: string;
  emailSubject?: string;
}

export async function publish(options: Options) {
  const { topicArn, region, message, emailSubject, signer, retryOpt } = options;
  const url = getSnsBaseUrl(region);

  const payload = new URLSearchParams({
    Action: "Publish",
    Version: "2010-03-31",
    TopicArn: topicArn,
    Message: message,
    ...(emailSubject ? { Subject: emailSubject } : {}),
  }).toString();

  const req = new Request(url, {
    method: "post",
    body: payload,
    headers: {
      [HEADER.ContentType]: "application/x-www-form-urlencoded",
      "x-amz-content-sha256": await toSha256Hex(payload),
    },
  });

  const signedReq = await signer.sign("sns", req);
  const resp = await fetchWithRetry(signedReq, retryOpt);

  if (!resp.ok) {
    const respText = await resp.text();
    throw new Error(respText);
  }
}
