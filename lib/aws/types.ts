import { type RetryOptions } from "@std/async";

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface AwsActionBase {
  retryOpt?: RetryOptions;
}
