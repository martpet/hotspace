import { type AWSSignerV4 } from "deno_aws_sign_v4";

interface Options {
  job: Record<string, string>;
  signer: AWSSignerV4;
  region: string;
}

export default async function createJob(options: Options) {
  const { region, job, signer } = options;
  const url = `https://mediaconvert.${region}.amazonaws.com/2017-08-29/jobs`;

  const req = new Request(url, {
    method: "post",
    body: JSON.stringify(job),
  });

  const signedReq = await signer.sign("mediaconvert", req);

  const resp = await fetch(signedReq);

  console.log(await resp.json());
}
