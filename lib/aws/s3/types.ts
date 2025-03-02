import type { AWSSignerV4 } from "deno_aws_sign_v4";

export interface S3ReqOptions {
  bucket: string;
  signer: AWSSignerV4;
}

export interface CompletedMultipartUpload {
  uploadId: string;
  s3Key: string;
  checksum: string;
  fileName: string;
  fileType: string;
  finishedParts: FinishedUploadPart[];
}

export interface FinishedUploadPart {
  partNumber: number;
  partSize: number;
  etag: string;
}
