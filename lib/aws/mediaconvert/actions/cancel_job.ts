import { fetchWithRetry } from "$util";
import { type AWSSignerV4 } from "deno_aws_sign_v4";
import type { AwsActionBase } from "../../types.ts";

interface Options extends AwsActionBase {
  jobId: string;
  signer: AWSSignerV4;
  region: string;
}

export async function cancelJob(options: Options) {
  const { jobId, region, signer, retryOpt } = options;
  const url =
    `https://mediaconvert.${region}.amazonaws.com/2017-08-29/jobs/${jobId}`;

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
