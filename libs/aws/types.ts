import { type RetryOptions } from "@std/async";
import { AWSSignerV4 } from "deno_aws_sign_v4";

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface AwsActionBase {
  signer: AWSSignerV4;
  retryOpt?: RetryOptions;
}
