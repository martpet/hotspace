import { fetchWithRetry } from "$util";
import type { AwsActionBase } from "../../types.ts";
import { getMediaConvertEndpoint } from "../util.ts";

interface Options extends AwsActionBase {
  jobId: string;
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
