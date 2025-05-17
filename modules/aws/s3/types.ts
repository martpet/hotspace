import { AwsActionBase } from "../types.ts";

export interface S3ReqOptions extends AwsActionBase {
  bucket: string;
  accelerated?: boolean;
}

export interface CompleteMultipartInit {
  uploadId: string;
  s3Key: string;
  checksum: string;
  fileName: string;
  mimeType: string;
  finishedParts: FinishedUploadPart[];
}

export interface CompletedUpload extends CompleteMultipartInit {
  fileSize: number;
}

export interface FinishedUploadPart {
  partNumber: number;
  partSize: number;
  etag: string;
}
