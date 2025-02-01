export interface S3Options {
  bucket: string;
  region: string;
  credentials: AwsCredentials;
}

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface FinishedUploadPart {
  partNumber: number;
  partSize: number;
  etag: string;
}

export interface SavedUpload {
  uploadId: string;
  s3Key: string;
  checksum: string;
  createdOn: number;
  finishedParts: FinishedUploadPart[];
}

export interface UploadInitData {
  fileType: string;
  fileName: string;
  numberOfParts: number;
  savedUpload?: SavedUpload;
}

export interface CompletedUpload {
  uploadId: string;
  s3Key: string;
  checksum: string;
  fileName: string;
  fileType: string;
  finishedParts: FinishedUploadPart[];
}
