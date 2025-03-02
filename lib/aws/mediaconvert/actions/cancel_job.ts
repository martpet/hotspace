import { type AWSSignerV4 } from "deno_aws_sign_v4";
import { fetchWithRetry } from "../../util.ts";

interface Options {
  jobId: string;
  signer: AWSSignerV4;
  region: string;
}

export async function cancelJob(options: Options) {
  const { jobId, region, signer } = options;
  const url =
    `https://mediaconvert.${region}.amazonaws.com/2017-08-29/jobs/${jobId}`;

  const req = new Request(url, {
    method: "delete",
  });

  const signedReq = await signer.sign("mediaconvert", req);
  const resp = await fetchWithRetry(signedReq);
  const data = await resp.json();

  if (!resp.ok) {
    const error = data.message as string;
    console.error(error);
  }
}
