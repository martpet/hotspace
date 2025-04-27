import { AwsActionBase } from "../types.ts";

export interface S3ReqOptions extends AwsActionBase {
  bucket: string;
  accelerated?: boolean;
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
