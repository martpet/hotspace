import { fetchWithRetry } from "$util";
import type { AwsActionBase } from "../../types.ts";
import { getMediaConvertBaseUrl } from "../util.ts";

interface Options extends AwsActionBase {
  job: Record<string, unknown>;
  region: string;
}

export async function createJob(options: Options) {
  const { region, job, signer, retryOpt } = options;
  const url = `${getMediaConvertBaseUrl(region)}/jobs`;

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
