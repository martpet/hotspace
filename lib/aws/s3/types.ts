import type { RetryOptions } from "@std/async";
import type { AWSSignerV4 } from "deno_aws_sign_v4";

export interface S3ReqOptions {
  bucket: string;
  signer: AWSSignerV4;
  retryOptions?: RetryOptions;
}

export interface FinishedUploadPart {
  partNumber: number;
  partSize: number;
  etag: string;
}

export interface CompletedUpload {
  uploadId: string;
  s3Key: string;
  checksum: string;
  fileName: string;
  fileType: string;
  finishedParts: FinishedUploadPart[];
}
