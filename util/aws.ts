import { AWSSignerV4 } from "deno_aws_sign_v4";
import { AWS_CREDENTIALS, AWS_REGION } from "./consts.ts";

let signer: AWSSignerV4;

export function getSigner() {
  if (signer) return signer;

  signer = new AWSSignerV4(AWS_REGION, {
    awsAccessKeyId: AWS_CREDENTIALS.accessKeyId,
    awsSecretKey: AWS_CREDENTIALS.secretAccessKey,
  });

  return signer;
}
