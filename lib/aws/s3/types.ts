import type { AwsCredentials } from "../types.ts";

export interface S3Options {
  bucket: string;
  region: string;
  credentials: AwsCredentials;
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
