import { fetchWithRetry } from "$util";
import { type AWSSignerV4 } from "deno_aws_sign_v4";
import type { AwsActionBase } from "../../types.ts";

interface Options extends AwsActionBase {
  job: Record<string, unknown>;
  signer: AWSSignerV4;
  region: string;
}

export async function createJob(options: Options) {
  const { region, job, signer, retryOpt } = options;
  const url = `https://mediaconvert.${region}.amazonaws.com/2017-08-29/jobs`;

  const req = new Request(url, {
    method: "post",
    body: JSON.stringify(job),
  });

  const signedReq = await signer.sign("mediaconvert", req);
  const resp = await fetchWithRetry(signedReq, retryOpt);
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message);
  }

  return data.job.id as string;
}
