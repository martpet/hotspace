import { fetchWithRetry } from "$util";
import { type AWSSignerV4 } from "deno_aws_sign_v4";
import type { AwsActionBase } from "../../types.ts";
import { getMediaConvertEndpoint } from "../util.ts";

interface Options extends AwsActionBase {
  jobId: string;
  signer: AWSSignerV4;
  region: string;
}

export async function cancelJob(options: Options) {
  const { jobId, region, signer, retryOpt } = options;
  const url = `${getMediaConvertEndpoint(region)}/jobs/${jobId}`;

  const req = new Request(url, {
    method: "delete",
  });

  const signedReq = await signer.sign("mediaconvert", req);
  const resp = await fetchWithRetry(signedReq, retryOpt);
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message as string);
  }
}
