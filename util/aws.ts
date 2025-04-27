import { cloudfront } from "$aws";
import { AWSSignerV4 } from "deno_aws_sign_v4";
import {
  AWS_CREDENTIALS,
  AWS_REGION,
  CLOUDFRONT_KEYPAIR_ID,
  CLOUDFRONT_SIGNER_PRIVATE_KEY,
} from "./consts.ts";

let signer: AWSSignerV4;

export function getSigner() {
  if (signer) return signer;
  signer = new AWSSignerV4(AWS_REGION, {
    awsAccessKeyId: AWS_CREDENTIALS.accessKeyId,
    awsSecretKey: AWS_CREDENTIALS.secretAccessKey,
  });
  return signer;
}

export type SignCloudfrontUrlOptions = Pick<
  cloudfront.SignUrlOptions,
  "expireIn"
>;

export function signCloudfrontUrl(
  url: cloudfront.SignUrlOptions["url"],
  options: SignCloudfrontUrlOptions = {},
) {
  return cloudfront.signUrl({
    url,
    keyPairId: CLOUDFRONT_KEYPAIR_ID,
    privateKey: CLOUDFRONT_SIGNER_PRIVATE_KEY,
    ...options,
  });
}
